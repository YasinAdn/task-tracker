const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('./scheduler-core.js');

test('addTask creates a valid scheduled task and preserves immutability', () => {
  const initial = [];
  const res = Core.addTask(initial, {
    title: '  Team standup  ',
    date: '2026-11-12',
    startTime: '09:00',
    endTime: '09:30',
    category: 'work',
    priority: 'high',
    notes: 'Daily sync'
  });

  assert.equal(res.ok, true);
  assert.equal(initial.length, 0);
  assert.equal(res.tasks.length, 1);
  assert.equal(res.task.title, 'Team standup');
  assert.equal(res.task.startTime, '09:00');
  assert.equal(res.task.endTime, '09:30');
  assert.equal(res.task.completed, false);
  assert.ok(res.task.id);
});

test('addTask auto-fills endTime when only startTime is provided', () => {
  const res = Core.addTask([], {
    title: 'Quick call',
    date: '2026-11-12',
    startTime: '14:15'
  });

  assert.equal(res.ok, true);
  assert.equal(res.task.startTime, '14:15');
  assert.equal(res.task.endTime, '14:45');
});

test('addTask allows anytime task with no startTime or endTime', () => {
  const res = Core.addTask([], {
    title: 'Water plants',
    date: '2026-11-12',
    startTime: '',
    endTime: ''
  });

  assert.equal(res.ok, true);
  assert.equal(res.task.startTime, '');
  assert.equal(res.task.endTime, '');
});

test('validateTaskInput rejects missing title, invalid time order, or endTime without startTime', () => {
  assert.equal(Core.validateTaskInput({ title: '   ', date: '2026-11-12' }).valid, false);
  assert.equal(
    Core.validateTaskInput({
      title: 'Bad range',
      date: '2026-11-12',
      startTime: '11:00',
      endTime: '10:00'
    }).valid,
    false
  );
  assert.equal(
    Core.validateTaskInput({
      title: 'Missing start',
      date: '2026-11-12',
      startTime: '',
      endTime: '10:00'
    }).valid,
    false
  );
  assert.equal(
    Core.validateTaskInput({
      title: 'Bad date',
      date: '2026-02-30'
    }).valid,
    false
  );
});

test('updateTask edits existing fields and enforces validation', () => {
  const created = Core.addTask([], {
    id: 't1',
    title: 'Draft report',
    date: '2026-11-12',
    startTime: '10:00',
    endTime: '11:00',
    priority: 'low'
  });

  const edited = Core.updateTask(created.tasks, 't1', {
    title: 'Finalize report',
    startTime: '10:30',
    endTime: '12:00',
    priority: 'high',
    completed: true
  });

  assert.equal(edited.ok, true);
  assert.equal(edited.task.title, 'Finalize report');
  assert.equal(edited.task.startTime, '10:30');
  assert.equal(edited.task.endTime, '12:00');
  assert.equal(edited.task.priority, 'high');
  assert.equal(edited.task.completed, true);

  const badEdit = Core.updateTask(edited.tasks, 't1', {
    startTime: '13:00',
    endTime: '12:00'
  });
  assert.equal(badEdit.ok, false);
  assert.equal(badEdit.tasks[0].startTime, '10:30');
});

test('removeTask and clearCompletedForDate remove matching tasks', () => {
  let tasks = [];
  tasks = Core.addTask(tasks, { id: 'a', title: 'A', date: '2026-11-12', completed: true }).tasks;
  tasks = Core.addTask(tasks, { id: 'b', title: 'B', date: '2026-11-12', completed: false }).tasks;
  tasks = Core.addTask(tasks, { id: 'c', title: 'C', date: '2026-11-13', completed: true }).tasks;

  const removed = Core.removeTask(tasks, 'b');
  assert.equal(removed.ok, true);
  assert.equal(removed.removed.id, 'b');
  assert.equal(removed.tasks.length, 2);

  const cleared = Core.clearCompletedForDate(removed.tasks, '2026-11-12');
  assert.equal(cleared.removedCount, 1);
  assert.deepEqual(
    cleared.tasks.map((t) => t.id),
    ['c']
  );
});

test('filterAndSortTasks sorts chronologically and separates anytime tasks', () => {
  let tasks = [];
  tasks = Core.addTask(tasks, { id: '1', title: 'Anytime', date: '2026-11-12' }).tasks;
  tasks = Core.addTask(tasks, { id: '2', title: 'Afternoon', date: '2026-11-12', startTime: '14:00', endTime: '15:00' }).tasks;
  tasks = Core.addTask(tasks, { id: '3', title: 'Morning', date: '2026-11-12', startTime: '08:00', endTime: '09:00' }).tasks;
  tasks = Core.addTask(tasks, { id: '4', title: 'Next day', date: '2026-11-13', startTime: '08:00', endTime: '09:00' }).tasks;

  const res = Core.filterAndSortTasks(tasks, { date: '2026-11-12' });
  assert.deepEqual(res.scheduled.map((t) => t.id), ['3', '2']);
  assert.deepEqual(res.anytime.map((t) => t.id), ['1']);
});

test('computeTimelineLayout assigns side-by-side columns for overlapping tasks', () => {
  const scheduled = [
    { id: '1', startTime: '09:00', endTime: '10:30' },
    { id: '2', startTime: '09:30', endTime: '10:00' },
    { id: '3', startTime: '10:00', endTime: '11:00' },
    { id: '4', startTime: '12:00', endTime: '13:00' }
  ];

  const layout = Core.computeTimelineLayout(scheduled);
  assert.equal(layout.length, 4);
  // Task 1 and 2 overlap -> 2 columns; Task 3 starts when 2 ends so reuses col 1
  assert.equal(layout[0].totalCols, 2);
  assert.equal(layout[1].totalCols, 2);
  assert.equal(layout[2].totalCols, 2);
  assert.notEqual(layout[0].col, layout[1].col);
  assert.equal(layout[2].col, layout[1].col);
  // Task 4 is isolated
  assert.equal(layout[3].totalCols, 1);
  assert.equal(layout[3].col, 0);
});

test('computeDailyStats and shiftDateKey handle boundaries cleanly', () => {
  let tasks = [];
  tasks = Core.addTask(tasks, { title: 'One', date: '2026-11-12', startTime: '09:00', endTime: '10:30', completed: true }).tasks;
  tasks = Core.addTask(tasks, { title: 'Two', date: '2026-11-12', startTime: '11:00', endTime: '11:30', completed: false }).tasks;

  const stats = Core.computeDailyStats(tasks, '2026-11-12');
  assert.deepEqual(stats, {
    total: 2,
    totalWithOverdue: 2,
    overdueCount: 0,
    completed: 1,
    pending: 1,
    scheduledMinutes: 120,
    completionRate: 50
  });

  assert.equal(Core.shiftDateKey('2026-11-30', 1), '2026-12-01');
  assert.equal(Core.shiftDateKey('2026-01-01', -1), '2025-12-31');
});

test('tasks of 11th that are incomplete appear in overdue when viewing 12th', () => {
  let tasks = [];
  // Completed task from 11th (should stay in past)
  tasks = Core.addTask(tasks, {
    id: 'past-done',
    title: 'Completed on 11th',
    date: '2026-11-11',
    completed: true
  }).tasks;

  // Incomplete ticket from 11th (like user shipping ticket)
  tasks = Core.addTask(tasks, {
    id: 'past-open',
    title: 'Shipping ticket 1Z03G13B0339691067 made for Springdale Store',
    date: '2026-11-11',
    category: 'shipping',
    completed: false
  }).tasks;

  // Task scheduled on 12th
  tasks = Core.addTask(tasks, {
    id: 'today-task',
    title: 'Phone lines at XYZ Store are up',
    date: '2026-11-12',
    startTime: '10:00',
    endTime: '10:30',
    completed: false
  }).tasks;

  const view12 = Core.filterAndSortTasks(tasks, { date: '2026-11-12' });
  assert.equal(view12.overdue.length, 1);
  assert.equal(view12.overdue[0].id, 'past-open');
  assert.equal(view12.scheduled.length, 1);
  assert.equal(view12.scheduled[0].id, 'today-task');
  assert.equal(view12.all.length, 2); // Both visible on the 12th!

  // Stats on 12th include the rolled over task
  const stats12 = Core.computeDailyStats(tasks, '2026-11-12');
  assert.equal(stats12.total, 1);
  assert.equal(stats12.totalWithOverdue, 2);
  assert.equal(stats12.overdueCount, 1);

  // Test moveTaskToDate
  const movedSingle = Core.moveTaskToDate(tasks, 'past-open', '2026-11-12');
  assert.equal(movedSingle.ok, true);
  assert.equal(movedSingle.task.date, '2026-11-12');

  // Test moveAllOverdueToDate
  const movedAll = Core.moveAllOverdueToDate(tasks, '2026-11-12');
  assert.equal(movedAll.ok, true);
  assert.equal(movedAll.movedCount, 1);
  const updatedOpen = movedAll.tasks.find((t) => t.id === 'past-open');
  assert.equal(updatedOpen.date, '2026-11-12');
});

test('updateTask can convert scheduled task to anytime and createSampleTasks seeds valid tasks', () => {
  const created = Core.addTask([], {
    id: 'conv1',
    title: 'Flexible errand',
    date: '2026-11-12',
    startTime: '15:00',
    endTime: '16:00'
  });
  const updated = Core.updateTask(created.tasks, 'conv1', {
    startTime: '',
    endTime: ''
  });
  assert.equal(updated.ok, true);
  assert.equal(updated.task.startTime, '');
  assert.equal(updated.task.endTime, '');

  const samples = Core.createSampleTasks('2026-11-12');
  assert.equal(samples.length, 5);
  assert.ok(samples.every((t) => t.date === '2026-11-12' && t.id));
  assert.match(samples[0].title, /Contacted POC/);
  assert.match(samples[1].title, /Shipping ticket/);
  assert.match(samples[2].title, /Phone lines/);
  assert.match(samples[3].title, /ATA Device issue/);
  assert.match(samples[4].title, /Mailed supplies/);
});

test('snoozeTask advances task by specified hours and resets completed status', () => {
  const initial = Core.addTask([], {
    id: 'snooze1',
    title: 'POC follow-up',
    date: '2026-11-12',
    startTime: '09:00',
    endTime: '09:30',
    completed: true
  }).tasks;

  const snoozed = Core.snoozeTask(initial, 'snooze1', 2);
  assert.equal(snoozed.ok, true);
  assert.equal(snoozed.task.startTime, '11:00');
  assert.equal(snoozed.task.endTime, '11:30');
  assert.equal(snoozed.task.completed, false);
});

test('TEMPLATES and operational categories are configured properly', () => {
  assert.ok(Core.CATEGORIES.support);
  assert.ok(Core.CATEGORIES.shipping);
  assert.ok(Core.CATEGORIES.telecom);
  assert.ok(Core.CATEGORIES.hardware);
  assert.ok(Core.CATEGORIES.supplies);

  assert.ok(Core.TEMPLATES.poc);
  assert.ok(Core.TEMPLATES.shipping);
  assert.ok(Core.TEMPLATES.phones);
  assert.ok(Core.TEMPLATES.ata);
  assert.ok(Core.TEMPLATES.supplies);

  // Legacy category mapping
  const res = Core.addTask([], {
    title: 'Old task',
    date: '2026-11-12',
    category: 'work'
  });
  assert.equal(res.task.category, 'support');
});

test('TEMPLATE_CONFIGS builds clean tasks from real user inputs without dummy placeholders', () => {
  assert.ok(Core.TEMPLATE_CONFIGS.shipping);
  const shipTask = Core.TEMPLATE_CONFIGS.shipping.build({
    store: 'Springdale Store',
    ticket: '1Z03G13B0339691067',
    items: 'AC unit, filters',
    status: 'Label created'
  }, '2026-11-12');

  assert.equal(shipTask.title, 'Shipping ticket 1Z03G13B0339691067 made for Springdale Store (items: AC unit, filters)');
  assert.equal(shipTask.category, 'shipping');
  assert.ok(shipTask.notes.includes('Ticket #: 1Z03G13B0339691067'));
  assert.ok(shipTask.notes.includes('Store: Springdale Store'));
  assert.ok(!shipTask.title.includes('XXXXXXXXXXXX'));
  assert.ok(!shipTask.title.includes('XYZ'));
  assert.ok(Core.validateTaskInput(shipTask).valid);

  const pocTask = Core.TEMPLATE_CONFIGS.poc.build({
    store: 'Store #104',
    poc: 'Store Manager',
    hours: '2',
    details: 'No answer on initial call'
  }, '2026-11-12');

  assert.match(pocTask.title, /Contacted POC at Store #104/);
  assert.equal(pocTask.category, 'support');
  assert.ok(Core.validateTaskInput(pocTask).valid);

  // Validate all configs produce valid tasks
  const phonesTask = Core.TEMPLATE_CONFIGS.phones.build({ store: 'Store #104' }, '2026-11-12');
  assert.ok(Core.validateTaskInput(phonesTask).valid);

  const ataTask = Core.TEMPLATE_CONFIGS.ata.build({ store: 'Store #104' }, '2026-11-12');
  assert.ok(Core.validateTaskInput(ataTask).valid);

  const suppliesTask = Core.TEMPLATE_CONFIGS.supplies.build({
    store: 'Store #104',
    issue: 'Broken power adapter',
    supplies: 'AC adapter and cable'
  }, '2026-11-12');
  assert.ok(Core.validateTaskInput(suppliesTask).valid);
});

test('RBAC: authenticateUser validates admin and viewer credentials strictly', () => {
  const adminRes = Core.authenticateUser('admin', 'PkKhi3571592580');
  assert.equal(adminRes.ok, true);
  assert.equal(adminRes.user.username, 'admin');
  assert.equal(adminRes.user.role, 'admin');

  const viewerRes = Core.authenticateUser('viewer', 'qwerZ@123');
  assert.equal(viewerRes.ok, true);
  assert.equal(viewerRes.user.username, 'viewer');
  assert.equal(viewerRes.user.role, 'viewer');

  const wrongPass = Core.authenticateUser('admin', 'wrong_pass');
  assert.equal(wrongPass.ok, false);
  assert.match(wrongPass.error, /invalid/i);

  const unknownUser = Core.authenticateUser('hacker', '123456');
  assert.equal(unknownUser.ok, false);
});

test('RBAC: canUserPerformAction enforces viewer restrictions', () => {
  assert.equal(Core.canUserPerformAction('admin', 'add'), true);
  assert.equal(Core.canUserPerformAction('admin', 'edit'), true);
  assert.equal(Core.canUserPerformAction('admin', 'delete'), true);
  assert.equal(Core.canUserPerformAction('admin', 'export'), true);
  assert.equal(Core.canUserPerformAction('admin', 'view'), true);
  assert.equal(Core.canUserPerformAction('admin', 'logout'), true);

  assert.equal(Core.canUserPerformAction('viewer', 'view'), true);
  assert.equal(Core.canUserPerformAction('viewer', 'logout'), true);
  assert.equal(Core.canUserPerformAction('viewer', 'add'), false);
  assert.equal(Core.canUserPerformAction('viewer', 'edit'), false);
  assert.equal(Core.canUserPerformAction('viewer', 'delete'), false);
  assert.equal(Core.canUserPerformAction('viewer', 'export'), false);
});

test('parseSpreadsheetRows imports Excel rows and normalizes times, categories, and dates', () => {
  const sampleRows = [
    {
      'Date': '2026-11-12',
      'Start Time': '8:30 PM',
      'End Time': '8:45 PM',
      'Task Title': 'Phone lines at Quincy are up at 8:36 pm',
      'Category': 'Phone & Telecom',
      'Priority': 'Medium',
      'Status': 'Completed',
      'Notes / Details': 'Inbound and outbound calls operational'
    },
    {
      'Date': '2026-11-12',
      'Start Time': 'Anytime',
      'End Time': '',
      'Task Title': 'Printer and scanner Issue Freedom Dr',
      'Category': 'Store Support / POC',
      'Priority': 'Medium',
      'Status': 'Completed',
      'Notes / Details': 'Sent to supplies'
    }
  ];

  const result = Core.parseSpreadsheetRows(sampleRows, [], '2026-11-12');
  assert.equal(result.importedCount, 2);
  assert.equal(result.tasks.length, 2);

  const t1 = result.tasks.find((t) => t.title.includes('Quincy'));
  assert.ok(t1);
  assert.equal(t1.startTime, '20:30');
  assert.equal(t1.endTime, '20:45');
  assert.equal(t1.category, 'telecom');
  assert.equal(t1.completed, true);

  const t2 = result.tasks.find((t) => t.title.includes('Freedom Dr'));
  assert.ok(t2);
  assert.equal(t2.startTime, '');
  assert.equal(t2.endTime, '');
  assert.equal(t2.category, 'support');
  assert.equal(t2.completed, true);
});

test('Work and Personal scope isolation in filterAndSortTasks, computeDailyStats, and clearCompleted', () => {
  const mixedTasks = [
    { id: '1', title: 'Work Task 1', date: '2026-11-12', startTime: '09:00', endTime: '10:00', scope: 'work', completed: false, category: 'support', priority: 'medium' },
    { id: '2', title: 'Work Task 2 Completed', date: '2026-11-12', startTime: '11:00', endTime: '12:00', scope: 'work', completed: true, category: 'telecom', priority: 'low' },
    { id: '3', title: 'Personal Task 1', date: '2026-11-12', startTime: '18:00', endTime: '19:00', scope: 'personal', completed: false, category: 'fitness', priority: 'high' },
    { id: '4', title: 'Personal Task 2 Completed', date: '2026-11-12', startTime: '', endTime: '', scope: 'personal', completed: true, category: 'errands', priority: 'medium' },
    { id: '5', title: 'Overdue Work Task', date: '2026-11-11', startTime: '15:00', endTime: '16:00', scope: 'work', completed: false, category: 'shipping', priority: 'high' },
    { id: '6', title: 'Overdue Personal Task', date: '2026-11-11', startTime: '', endTime: '', scope: 'personal', completed: false, category: 'finance', priority: 'medium' }
  ];

  // Filtering by work scope
  const workGrouped = Core.filterAndSortTasks(mixedTasks, { date: '2026-11-12', scope: 'work' });
  assert.equal(workGrouped.all.length, 3); // 2 on date + 1 overdue
  assert.equal(workGrouped.overdue.length, 1);
  assert.equal(workGrouped.overdue[0].id, '5');
  assert.equal(workGrouped.scheduled.length, 2);

  // Filtering by personal scope
  const personalGrouped = Core.filterAndSortTasks(mixedTasks, { date: '2026-11-12', scope: 'personal' });
  assert.equal(personalGrouped.all.length, 3); // 2 on date + 1 overdue
  assert.equal(personalGrouped.overdue.length, 1);
  assert.equal(personalGrouped.overdue[0].id, '6');
  assert.equal(personalGrouped.scheduled.length, 1);
  assert.equal(personalGrouped.anytime.length, 1);

  // Stats for work scope
  const workStats = Core.computeDailyStats(mixedTasks, '2026-11-12', 'work');
  assert.equal(workStats.total, 2);
  assert.equal(workStats.totalWithOverdue, 3);
  assert.equal(workStats.completed, 1);
  assert.equal(workStats.overdueCount, 1);

  // Stats for personal scope
  const personalStats = Core.computeDailyStats(mixedTasks, '2026-11-12', 'personal');
  assert.equal(personalStats.total, 2);
  assert.equal(personalStats.totalWithOverdue, 3);
  assert.equal(personalStats.completed, 1);
  assert.equal(personalStats.overdueCount, 1);

  // Clear completed personal tasks only
  const clearedPersonal = Core.clearCompletedForDate(mixedTasks, '2026-11-12', 'personal');
  assert.equal(clearedPersonal.removedCount, 1);
  assert.ok(clearedPersonal.tasks.some((t) => t.id === '2')); // Work completed task preserved!
  assert.ok(!clearedPersonal.tasks.some((t) => t.id === '4')); // Personal completed task removed

  // Move overdue work tasks only
  const movedWork = Core.moveAllOverdueToDate(mixedTasks, '2026-11-12', 'work');
  assert.equal(movedWork.movedCount, 1);
  const task5 = movedWork.tasks.find((t) => t.id === '5');
  const task6 = movedWork.tasks.find((t) => t.id === '6');
  assert.equal(task5.date, '2026-11-12'); // Moved to today
  assert.equal(task6.date, '2026-11-11'); // Personal overdue kept untouched
});

test('Follow-up notification: 15-minute snooze and getTaskFollowupTime calculation', () => {
  const initialTask = {
    id: 'morrilton_1',
    title: 'Contacted POC at Morrilton, no response — will check back in 15 mins',
    date: '2026-11-12',
    startTime: '21:00',
    endTime: '21:15',
    scope: 'work',
    completed: false
  };

  // Check follow-up time based on date and endTime
  const dueMs = Core.getTaskFollowupTime(initialTask);
  assert.ok(dueMs !== null);
  const dueDate = new Date(dueMs);
  assert.equal(dueDate.getFullYear(), 2026);
  assert.equal(dueDate.getMonth(), 10); // 0-indexed November
  assert.equal(dueDate.getDate(), 12);
  assert.equal(dueDate.getHours(), 21);
  assert.equal(dueDate.getMinutes(), 15);

  // Snooze by 15 minutes (0.25 hours) at 21:00
  const refTime = new Date(2026, 10, 12, 21, 0, 0);
  const snoozeRes = Core.snoozeTask([initialTask], 'morrilton_1', 0.25, refTime);
  assert.equal(snoozeRes.ok, true);
  const snoozed = snoozeRes.task;
  assert.equal(snoozed.startTime, '21:15');
  assert.equal(snoozed.endTime, '21:30');
  assert.ok(snoozed.remindAt);
  assert.equal(snoozed.notifiedAt, '');

  // getTaskFollowupTime gives the explicit remindAt timestamp
  const snoozedDueMs = Core.getTaskFollowupTime(snoozed);
  assert.equal(snoozedDueMs, Date.parse(snoozed.remindAt));
});
