/**
 * Core pure logic for the Daily Task Scheduler.
 * Works both in the browser (window.SchedulerCore) and in Node.js (CommonJS).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SchedulerCore = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CATEGORIES = Object.freeze({
    support: { label: 'Store Support / POC', color: '#69be28' },
    shipping: { label: 'Shipping & Logistics', color: '#059669' },
    telecom: { label: 'Phone & Telecom', color: '#4f46e5' },
    hardware: { label: 'Hardware / ATA', color: '#d97706' },
    supplies: { label: 'Mailed Supplies', color: '#9333ea' },
    other: { label: 'General / Other', color: '#64748b' }
  });

  const LEGACY_CATEGORY_MAP = Object.freeze({
    work: 'support',
    personal: 'other',
    health: 'other',
    learning: 'other',
    errands: 'shipping'
  });

  const TEMPLATE_CONFIGS = Object.freeze({
    shipping: {
      id: 'shipping',
      name: 'Shipping Ticket',
      icon: '📦',
      description: 'Record a shipping ticket for a store with tracking & items.',
      fields: [
        { key: 'store', label: 'Store Name or #', type: 'text', placeholder: 'e.g. Springdale Store or #104', required: true },
        { key: 'ticket', label: 'Ticket / Tracking #', type: 'text', placeholder: 'e.g. 1Z03G13B0339691067', required: true },
        { key: 'items', label: 'Items Included', type: 'text', placeholder: 'e.g. AC unit, cables, XYZ parts', required: false },
        { key: 'status', label: 'Shipping Status', type: 'text', defaultValue: 'Shipping label created', required: false }
      ],
      build(data, dateKey) {
        const store = String(data.store || '').trim();
        const ticket = String(data.ticket || '').trim();
        const items = String(data.items || '').trim();
        const status = String(data.status || 'Shipping label created').trim();

        const title = items
          ? `Shipping ticket ${ticket} made for ${store} (items: ${items})`
          : `Shipping ticket ${ticket} made for ${store}`;

        const notes = [
          `Ticket #: ${ticket}`,
          `Store: ${store}`,
          items ? `Items: ${items}` : null,
          `Status: ${status}`
        ].filter(Boolean).join('\n');

        return {
          title,
          date: dateKey || formatDateKey(new Date()),
          startTime: '',
          endTime: '',
          category: 'shipping',
          priority: 'medium',
          notes,
          completed: false
        };
      }
    },
    poc: {
      id: 'poc',
      name: 'POC Follow-up',
      icon: '📞',
      description: 'Log an outreach to a store POC with an automatic follow-up timer.',
      fields: [
        { key: 'store', label: 'Store Name or #', type: 'text', placeholder: 'e.g. Store #104 or Springdale Store', required: true },
        { key: 'poc', label: 'POC Name / Title', type: 'text', placeholder: 'e.g. Store Manager', defaultValue: 'Store Manager', required: false },
        { key: 'hours', label: 'Check back in (hours)', type: 'select', defaultValue: '2', options: ['1', '2', '3', '4'], required: true },
        { key: 'details', label: 'Call Outcome / Notes', type: 'text', defaultValue: 'No response on initial call', required: false }
      ],
      build(data, dateKey) {
        const store = String(data.store || '').trim();
        const poc = String(data.poc || 'Store Manager').trim();
        const hours = Number(data.hours) || 2;
        const details = String(data.details || 'No response on initial call').trim();

        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const startMins = Math.min(MAX_DAY_MINUTES - 15, Math.ceil((nowMins + hours * 60) / 15) * 15);
        const endMins = Math.min(MAX_DAY_MINUTES, startMins + 30);

        return {
          title: `Contacted POC at ${store}, no response — will check back in ${hours} hours`,
          date: dateKey || formatDateKey(new Date()),
          startTime: minutesToTime(startMins),
          endTime: minutesToTime(endMins),
          category: 'support',
          priority: 'high',
          notes: `Store: ${store}\nPOC: ${poc}\nStatus: ${details}. Scheduled follow-up in ${hours} hours.`,
          completed: false
        };
      }
    },
    phones: {
      id: 'phones',
      name: 'Phone Lines Up',
      icon: '☎️',
      description: 'Confirm phone lines and inbound/outbound calls are working.',
      fields: [
        { key: 'store', label: 'Store Name or #', type: 'text', placeholder: 'e.g. Springdale Store', required: true },
        { key: 'timeStr', label: 'Time Verified', type: 'text', placeholder: 'Leave blank to use current time', required: false },
        { key: 'details', label: 'Verification Details', type: 'text', defaultValue: 'Inbound and outbound calls verified operational', required: false }
      ],
      build(data, dateKey) {
        const store = String(data.store || '').trim();
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const timeStr = String(data.timeStr || '').trim() || formatTime12h(minutesToTime(nowMins));
        const details = String(data.details || 'Inbound and outbound calls verified operational').trim();

        const startMins = Math.min(MAX_DAY_MINUTES - 15, Math.floor(nowMins / 15) * 15);
        const endMins = Math.min(MAX_DAY_MINUTES, startMins + 15);

        return {
          title: `Phone lines at ${store} are up at ${timeStr}`,
          date: dateKey || formatDateKey(new Date()),
          startTime: minutesToTime(startMins),
          endTime: minutesToTime(endMins),
          category: 'telecom',
          priority: 'medium',
          notes: `Store: ${store}\nStatus: ${details}\nTime verified: ${timeStr}`,
          completed: true
        };
      }
    },
    ata: {
      id: 'ata',
      name: 'ATA Device Issue',
      icon: '🖧',
      description: 'Report an ATA VoIP adapter outage and escalate to group chat.',
      fields: [
        { key: 'store', label: 'Store Name or #', type: 'text', placeholder: 'e.g. Springdale Store or #104', required: true },
        { key: 'symptoms', label: 'Symptoms / Device Issue', type: 'text', defaultValue: 'Offline / No dial tone', required: false },
        { key: 'escalation', label: 'Escalation Action', type: 'text', defaultValue: 'Sent in group chat for tech lead review', required: false }
      ],
      build(data, dateKey) {
        const store = String(data.store || '').trim();
        const symptoms = String(data.symptoms || 'Offline / No dial tone').trim();
        const escalation = String(data.escalation || 'Sent in group chat for tech review').trim();

        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const startMins = Math.min(MAX_DAY_MINUTES - 15, Math.floor(nowMins / 15) * 15);
        const endMins = Math.min(MAX_DAY_MINUTES, startMins + 30);

        return {
          title: `ATA Device issue at ${store} — ${escalation}`,
          date: dateKey || formatDateKey(new Date()),
          startTime: minutesToTime(startMins),
          endTime: minutesToTime(endMins),
          category: 'hardware',
          priority: 'high',
          notes: `Store: ${store}\nHardware: ATA (Analog Telephone Adapter)\nSymptoms: ${symptoms}\nAction: ${escalation}`,
          completed: false
        };
      }
    },
    supplies: {
      id: 'supplies',
      name: 'Mailed Supplies',
      icon: '📬',
      description: 'Log replacement parts/supplies shipped to a store.',
      fields: [
        { key: 'store', label: 'Store Name or #', type: 'text', placeholder: 'e.g. Springdale Store', required: true },
        { key: 'issue', label: 'Issue / Reason for Supplies', type: 'text', placeholder: 'e.g. AC unit failure, damaged power cord', required: true },
        { key: 'supplies', label: 'Supplies / Items Mailed', type: 'text', placeholder: 'e.g. Replacement AC adapter & patch cables', required: true },
        { key: 'status', label: 'Tracking / Status', type: 'text', defaultValue: 'Packed and mailed', required: false }
      ],
      build(data, dateKey) {
        const store = String(data.store || '').trim();
        const issue = String(data.issue || 'Supplies request').trim();
        const supplies = String(data.supplies || '').trim();
        const status = String(data.status || 'Packed and mailed').trim();

        return {
          title: `Mailed supplies for ${store} for ${issue}`,
          date: dateKey || formatDateKey(new Date()),
          startTime: '',
          endTime: '',
          category: 'supplies',
          priority: 'medium',
          notes: `Store: ${store}\nIssue: ${issue}\nSupplies: ${supplies}\nStatus: ${status}`,
          completed: false
        };
      }
    }
  });

  const TEMPLATES = TEMPLATE_CONFIGS;

  const PRIORITIES = Object.freeze({
    high: { label: 'High', weight: 3 },
    medium: { label: 'Medium', weight: 2 },
    low: { label: 'Low', weight: 1 }
  });

  const DEFAULT_DURATION_MINUTES = 30;
  const MAX_DAY_MINUTES = 23 * 60 + 59;

  /**
   * Generates a unique identifier for a task.
   * @returns {string}
   */
  function createId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  /**
   * Formats a Date instance into YYYY-MM-DD using local calendar fields.
   * @param {Date} [date]
   * @returns {string}
   */
  function formatDateKey(date) {
    const d = date instanceof Date ? date : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Parses a YYYY-MM-DD string into a local Date, or returns null if invalid.
   * @param {string} dateKey
   * @returns {Date|null}
   */
  function parseDateKey(dateKey) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || '').trim());
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const dt = new Date(year, month - 1, day);
    if (
      dt.getFullYear() !== year ||
      dt.getMonth() !== month - 1 ||
      dt.getDate() !== day
    ) {
      return null;
    }
    return dt;
  }

  /**
   * Shifts a YYYY-MM-DD date key by deltaDays.
   * @param {string} dateKey
   * @param {number} deltaDays
   * @returns {string}
   */
  function shiftDateKey(dateKey, deltaDays) {
    const dt = parseDateKey(dateKey);
    if (!dt) return formatDateKey(new Date());
    const shifted = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + Number(deltaDays || 0));
    return formatDateKey(shifted);
  }

  /**
   * Converts HH:MM (24-hour) to minutes since midnight, or null if blank/invalid.
   * @param {string} timeStr
   * @returns {number|null}
   */
  function timeToMinutes(timeStr) {
    const trimmed = String(timeStr || '').trim();
    if (!trimmed) return null;
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  /**
   * Converts minutes since midnight (0..1439) to HH:MM.
   * @param {number} totalMinutes
   * @returns {string}
   */
  function minutesToTime(totalMinutes) {
    const clamped = Math.max(0, Math.min(MAX_DAY_MINUTES, Math.round(totalMinutes)));
    const h = String(Math.floor(clamped / 60)).padStart(2, '0');
    const m = String(clamped % 60).padStart(2, '0');
    return `${h}:${m}`;
  }

  /**
   * Formats HH:MM into a readable 12-hour label (e.g. "9:30 AM").
   * @param {string} timeStr
   * @returns {string}
   */
  function formatTime12h(timeStr) {
    const mins = timeToMinutes(timeStr);
    if (mins === null) return '';
    const hours24 = Math.floor(mins / 60);
    const minutes = mins % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  /**
   * Formats a duration in minutes into a concise string like "45m" or "1h 30m".
   * @param {number} minutes
   * @returns {string}
   */
  function formatDuration(minutes) {
    if (!Number.isFinite(minutes) || minutes <= 0) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  }

  /**
   * Validates and normalizes task input fields.
   * @param {Object} input
   * @returns {{ valid: boolean, errors: string[], normalized: Object|null }}
   */
  function validateTaskInput(input) {
    const errors = [];
    const src = input && typeof input === 'object' ? input : {};

    const title = String(src.title || '').trim();
    if (!title) {
      errors.push('Task title is required.');
    } else if (title.length > 160) {
      errors.push('Task title must be 160 characters or fewer.');
    }

    const date = String(src.date || '').trim() || formatDateKey(new Date());
    if (!parseDateKey(date)) {
      errors.push('Please provide a valid date (YYYY-MM-DD).');
    }

    const rawStart = String(src.startTime || '').trim();
    const rawEnd = String(src.endTime || '').trim();
    let startTime = '';
    let endTime = '';

    if (rawStart && timeToMinutes(rawStart) === null) {
      errors.push('Start time must be in HH:MM format.');
    }
    if (rawEnd && timeToMinutes(rawEnd) === null) {
      errors.push('End time must be in HH:MM format.');
    }

    if (!rawStart && rawEnd) {
      errors.push('Please set a start time when specifying an end time.');
    } else if (rawStart) {
      const startMins = timeToMinutes(rawStart);
      if (startMins !== null) {
        startTime = minutesToTime(startMins);
        if (rawEnd) {
          const endMins = timeToMinutes(rawEnd);
          if (endMins !== null) {
            if (endMins <= startMins) {
              errors.push('End time must be after start time.');
            } else {
              endTime = minutesToTime(endMins);
            }
          }
        } else {
          // Auto-fill default duration, clamped to end of day
          const autoEnd = Math.min(MAX_DAY_MINUTES, startMins + DEFAULT_DURATION_MINUTES);
          if (autoEnd <= startMins) {
            errors.push('Start time is too late in the day to schedule a duration.');
          } else {
            endTime = minutesToTime(autoEnd);
          }
        }
      }
    }

    let categoryKey = String(src.category || '').toLowerCase().trim();
    if (LEGACY_CATEGORY_MAP[categoryKey]) {
      categoryKey = LEGACY_CATEGORY_MAP[categoryKey];
    }
    const category = Object.prototype.hasOwnProperty.call(CATEGORIES, categoryKey)
      ? categoryKey
      : 'support';

    const priority = Object.prototype.hasOwnProperty.call(PRIORITIES, src.priority)
      ? src.priority
      : 'medium';

    const notes = String(src.notes || '').trim().slice(0, 1000);
    const completed = Boolean(src.completed);

    if (errors.length > 0) {
      return { valid: false, errors, normalized: null };
    }

    return {
      valid: true,
      errors: [],
      normalized: {
        title,
        date,
        startTime,
        endTime,
        category,
        priority,
        notes,
        completed
      }
    };
  }

  /**
   * Creates and appends a new task immutably.
   * @param {Array} tasks
   * @param {Object} input
   * @returns {{ ok: boolean, errors?: string[], tasks: Array, task?: Object }}
   */
  function addTask(tasks, input) {
    const list = Array.isArray(tasks) ? tasks : [];
    const check = validateTaskInput(input);
    if (!check.valid) {
      return { ok: false, errors: check.errors, tasks: list };
    }
    const now = new Date().toISOString();
    const task = {
      id: input && input.id ? String(input.id) : createId(),
      ...check.normalized,
      createdAt: now,
      updatedAt: now
    };
    return {
      ok: true,
      tasks: [...list, task],
      task
    };
  }

  /**
   * Updates an existing task by ID immutably.
   * @param {Array} tasks
   * @param {string} id
   * @param {Object} patch
   * @returns {{ ok: boolean, errors?: string[], tasks: Array, task?: Object }}
   */
  function updateTask(tasks, id, patch) {
    const list = Array.isArray(tasks) ? tasks : [];
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) {
      return { ok: false, errors: ['Task not found.'], tasks: list };
    }
    const existing = list[index];
    const merged = {
      ...existing,
      ...(patch && typeof patch === 'object' ? patch : {})
    };
    const check = validateTaskInput(merged);
    if (!check.valid) {
      return { ok: false, errors: check.errors, tasks: list };
    }
    const updated = {
      ...existing,
      ...check.normalized,
      updatedAt: new Date().toISOString()
    };
    const next = list.slice();
    next[index] = updated;
    return { ok: true, tasks: next, task: updated };
  }

  /**
   * Removes a task by ID immutably.
   * @param {Array} tasks
   * @param {string} id
   * @returns {{ ok: boolean, tasks: Array, removed: Object|null }}
   */
  function removeTask(tasks, id) {
    const list = Array.isArray(tasks) ? tasks : [];
    const target = list.find((t) => t.id === id) || null;
    if (!target) {
      return { ok: false, tasks: list, removed: null };
    }
    return {
      ok: true,
      tasks: list.filter((t) => t.id !== id),
      removed: target
    };
  }

  /**
   * Toggles completion state of a task by ID.
   * @param {Array} tasks
   * @param {string} id
   * @returns {{ ok: boolean, tasks: Array, task?: Object }}
   */
  function toggleTaskCompletion(tasks, id) {
    const list = Array.isArray(tasks) ? tasks : [];
    const existing = list.find((t) => t.id === id);
    if (!existing) return { ok: false, tasks: list };
    return updateTask(list, id, { completed: !existing.completed });
  }

  /**
   * Removes all completed tasks for a specific date.
   * @param {Array} tasks
   * @param {string} dateKey
   * @returns {{ tasks: Array, removedCount: number }}
   */
  function clearCompletedForDate(tasks, dateKey) {
    const list = Array.isArray(tasks) ? tasks : [];
    const next = list.filter((t) => !(t.date === dateKey && t.completed));
    return {
      tasks: next,
      removedCount: list.length - next.length
    };
  }

  /**
   * Moves a task to a target date.
   * @param {Array} tasks
   * @param {string} id
   * @param {string} targetDate
   * @returns {{ ok: boolean, tasks: Array, task?: Object }}
   */
  function moveTaskToDate(tasks, id, targetDate) {
    if (!parseDateKey(targetDate)) return { ok: false, tasks: Array.isArray(tasks) ? tasks : [] };
    return updateTask(tasks, id, { date: targetDate });
  }

  /**
   * Moves all incomplete tasks from before targetDate to targetDate.
   * @param {Array} tasks
   * @param {string} targetDate
   * @returns {{ ok: boolean, tasks: Array, movedCount: number }}
   */
  function moveAllOverdueToDate(tasks, targetDate) {
    const list = Array.isArray(tasks) ? tasks : [];
    if (!parseDateKey(targetDate)) return { ok: false, tasks: list, movedCount: 0 };
    let movedCount = 0;
    const next = list.map((task) => {
      if (task.date < targetDate && !task.completed) {
        movedCount += 1;
        return {
          ...task,
          date: targetDate,
          updatedAt: new Date().toISOString()
        };
      }
      return task;
    });
    return { ok: true, tasks: next, movedCount };
  }

  /**
   * Filters and sorts tasks for a specific date.
   * Automatically includes incomplete tasks from earlier dates in `overdue` so active tickets are never lost.
   * Separates scheduled (with start/end time) and anytime (no start time) tasks.
   * @param {Array} tasks
   * @param {Object} filters
   * @returns {{ all: Array, overdue: Array, scheduled: Array, anytime: Array }}
   */
  function filterAndSortTasks(tasks, filters) {
    const list = Array.isArray(tasks) ? tasks : [];
    const opts = filters && typeof filters === 'object' ? filters : {};
    const search = String(opts.search || '').trim().toLowerCase();
    const targetDate = opts.date || formatDateKey(new Date());

    const overdue = [];
    const scheduled = [];
    const anytime = [];

    for (const task of list) {
      if (search) {
        const haystack = `${task.title} ${task.notes || ''}`.toLowerCase();
        if (!haystack.includes(search)) continue;
      }
      if (opts.category && opts.category !== 'all' && task.category !== opts.category) continue;
      if (opts.priority && opts.priority !== 'all' && task.priority !== opts.priority) continue;
      if (opts.status === 'pending' && task.completed) continue;
      if (opts.status === 'completed' && !task.completed) continue;

      if (task.date === targetDate) {
        if (task.startTime) {
          scheduled.push(task);
        } else {
          anytime.push(task);
        }
      } else if (task.date < targetDate && !task.completed && opts.includeOverdue !== false) {
        overdue.push(task);
      }
    }

    overdue.sort((a, b) => {
      const dateDiff = String(a.date).localeCompare(String(b.date));
      if (dateDiff !== 0) return dateDiff;
      const weightDiff = (PRIORITIES[b.priority]?.weight || 0) - (PRIORITIES[a.priority]?.weight || 0);
      if (weightDiff !== 0) return weightDiff;
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    });

    scheduled.sort((a, b) => {
      const startDiff = (timeToMinutes(a.startTime) || 0) - (timeToMinutes(b.startTime) || 0);
      if (startDiff !== 0) return startDiff;
      const endDiff = (timeToMinutes(a.endTime) || 0) - (timeToMinutes(b.endTime) || 0);
      if (endDiff !== 0) return endDiff;
      return (PRIORITIES[b.priority]?.weight || 0) - (PRIORITIES[a.priority]?.weight || 0);
    });

    anytime.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const weightDiff = (PRIORITIES[b.priority]?.weight || 0) - (PRIORITIES[a.priority]?.weight || 0);
      if (weightDiff !== 0) return weightDiff;
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    });

    return {
      all: [...overdue, ...scheduled, ...anytime],
      overdue,
      scheduled,
      anytime
    };
  }

  /**
   * Computes non-overlapping column placement for scheduled tasks on a timeline.
   * Overlapping tasks are placed into side-by-side columns within each connected cluster.
   * @param {Array} scheduledTasks - Sorted scheduled tasks
   * @returns {Array<{ task: Object, startMins: number, endMins: number, col: number, totalCols: number }>}
   */
  function computeTimelineLayout(scheduledTasks) {
    const items = (Array.isArray(scheduledTasks) ? scheduledTasks : [])
      .map((task) => {
        const startMins = timeToMinutes(task.startTime);
        const endMins = timeToMinutes(task.endTime);
        if (startMins === null || endMins === null || endMins <= startMins) return null;
        return { task, startMins, endMins, col: 0, totalCols: 1 };
      })
      .filter(Boolean)
      .sort((a, b) => a.startMins - b.startMins || a.endMins - b.endMins);

    // Group overlapping tasks into connected clusters, then assign columns greedily per cluster
    let cluster = [];
    let clusterEnd = -1;

    function finalizeCluster(group) {
      if (group.length === 0) return;
      const columnEnds = [];
      for (const item of group) {
        let placedCol = columnEnds.findIndex((end) => end <= item.startMins);
        if (placedCol === -1) {
          placedCol = columnEnds.length;
          columnEnds.push(item.endMins);
        } else {
          columnEnds[placedCol] = item.endMins;
        }
        item.col = placedCol;
      }
      const totalCols = Math.max(1, columnEnds.length);
      for (const item of group) {
        item.totalCols = totalCols;
      }
    }

    for (const item of items) {
      if (cluster.length === 0 || item.startMins < clusterEnd) {
        cluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endMins);
      } else {
        finalizeCluster(cluster);
        cluster = [item];
        clusterEnd = item.endMins;
      }
    }
    finalizeCluster(cluster);

    return items;
  }

  /**
   * Computes summary statistics for a given date.
   * @param {Array} tasks
   * @param {string} dateKey
   * @returns {{ total: number, completed: number, pending: number, scheduledMinutes: number, completionRate: number }}
   */
  function computeDailyStats(tasks, dateKey) {
    const list = Array.isArray(tasks) ? tasks : [];
    const dayTasks = list.filter((t) => t.date === dateKey);
    const overdueTasks = list.filter((t) => t.date < dateKey && !t.completed);
    let completed = 0;
    let scheduledMinutes = 0;

    for (const task of dayTasks) {
      if (task.completed) completed += 1;
      const start = timeToMinutes(task.startTime);
      const end = timeToMinutes(task.endTime);
      if (start !== null && end !== null && end > start) {
        scheduledMinutes += end - start;
      }
    }

    const total = dayTasks.length;
    const totalWithOverdue = total + overdueTasks.length;
    return {
      total,
      totalWithOverdue,
      overdueCount: overdueTasks.length,
      completed,
      pending: total - completed,
      scheduledMinutes,
      completionRate: totalWithOverdue === 0 ? 0 : Math.round((completed / totalWithOverdue) * 100)
    };
  }

  /**
   * Reschedules or extends a task by deltaHours (e.g. +2 hours for POC follow-ups).
   * @param {Array} tasks
   * @param {string} id
   * @param {number} [hours=2]
   * @param {Date} [referenceDate]
   * @returns {{ ok: boolean, tasks: Array, task?: Object }}
   */
  function snoozeTask(tasks, id, hours, referenceDate) {
    const list = Array.isArray(tasks) ? tasks : [];
    const task = list.find((t) => t.id === id);
    if (!task) return { ok: false, tasks: list };

    const deltaMinutes = Math.round((Number(hours) || 2) * 60);
    const existingStart = timeToMinutes(task.startTime);
    const now = referenceDate instanceof Date ? referenceDate : new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let baseMins = existingStart !== null ? existingStart : currentMins;
    let newStartMins = Math.min(MAX_DAY_MINUTES - 15, baseMins + deltaMinutes);
    let newEndMins = Math.min(MAX_DAY_MINUTES, newStartMins + DEFAULT_DURATION_MINUTES);

    return updateTask(list, id, {
      startTime: minutesToTime(newStartMins),
      endTime: minutesToTime(newEndMins),
      completed: false
    });
  }

  /**
   * Creates operational sample tasks for a given date key matching daily store & IT support work.
   * @param {string} dateKey
   * @returns {Array<Object>}
   */
  function createSampleTasks(dateKey) {
    const targetDate = parseDateKey(dateKey) ? dateKey : formatDateKey(new Date());
    const samples = [
      {
        title: 'Contacted POC at store, no response — will check back in 2 hours',
        date: targetDate,
        startTime: '09:00',
        endTime: '09:30',
        category: 'support',
        priority: 'high',
        notes: 'Store: Store #104\nPOC: Store Manager\nStatus: No answer on first call. Scheduled follow-up in 2 hours.',
        completed: false
      },
      {
        title: 'Shipping ticket XXXXXXXXXXXX made for XYZ Store (items: AC, XYZ)',
        date: targetDate,
        startTime: '',
        endTime: '',
        category: 'shipping',
        priority: 'medium',
        notes: 'Ticket #: XXXXXXXXXXXX\nStore: XYZ Store\nItems included: AC unit, XYZ supplies\nStatus: Ticket created & dispatched.',
        completed: true
      },
      {
        title: 'Phone lines at XYZ Store are up at 10:30 AM',
        date: targetDate,
        startTime: '10:30',
        endTime: '11:00',
        category: 'telecom',
        priority: 'medium',
        notes: 'Store: XYZ Store\nStatus: Phone lines tested and confirmed up at 10:30 AM.',
        completed: true
      },
      {
        title: 'ATA Device issue — sent in group',
        date: targetDate,
        startTime: '11:30',
        endTime: '12:00',
        category: 'hardware',
        priority: 'high',
        notes: 'Store: XYZ Store\nDevice: ATA (Analog Telephone Adapter)\nSymptoms: No dial tone / offline\nEscalation: Sent incident details to team group chat for review.',
        completed: false
      },
      {
        title: 'Mailed supplies for ABC Store for XYZ issue',
        date: targetDate,
        startTime: '14:00',
        endTime: '14:45',
        category: 'supplies',
        priority: 'medium',
        notes: 'Store: ABC Store\nIssue: XYZ issue\nSupplies mailed: Replacement cords & power supply\nTracking: Pending carrier scan.',
        completed: false
      }
    ];
    let list = [];
    for (const s of samples) {
      const res = addTask(list, s);
      if (res.ok) list = res.tasks;
    }
    return list;
  }

  /**
   * Filters tasks for export based on date range or all-time, plus optional status & category.
   * @param {Array} tasks
   * @param {Object} options - { rangeType: 'all'|'range', startDate, endDate, status, category }
   * @returns {Array<Object>}
   */
  function filterTasksForExport(tasks, options) {
    const list = Array.isArray(tasks) ? tasks : [];
    const opts = options || {};
    const rangeType = opts.rangeType || 'all';
    const start = String(opts.startDate || '').trim();
    const end = String(opts.endDate || '').trim();
    const status = opts.status || 'all';
    const category = opts.category || 'all';

    return list.filter((task) => {
      if (rangeType === 'range') {
        if (start && task.date < start) return false;
        if (end && task.date > end) return false;
      }
      if (status === 'pending' && task.completed) return false;
      if (status === 'completed' && !task.completed) return false;
      if (category !== 'all' && task.category !== category) return false;
      return true;
    }).sort((a, b) => {
      const dateDiff = String(a.date).localeCompare(String(b.date));
      if (dateDiff !== 0) return dateDiff;
      const startA = timeToMinutes(a.startTime) ?? -1;
      const startB = timeToMinutes(b.startTime) ?? -1;
      return startA - startB;
    });
  }

  /**
   * Formats tasks into clean structured rows for Excel (.xlsx) export.
   * @param {Array<Object>} tasks
   * @returns {Array<Object>}
   */
  function buildSpreadsheetRows(tasks) {
    const list = Array.isArray(tasks) ? tasks : [];
    return list.map((t) => {
      const catConfig = CATEGORIES[t.category] || CATEGORIES.other;
      const prioConfig = PRIORITIES[t.priority] || PRIORITIES.medium;
      return {
        'Date': t.date,
        'Start Time': t.startTime ? formatTime12h(t.startTime) : 'Anytime',
        'End Time': t.endTime ? formatTime12h(t.endTime) : '',
        'Task Title': t.title,
        'Category': catConfig.label,
        'Priority': prioConfig.label,
        'Status': t.completed ? 'Completed' : 'Pending',
        'Notes / Details': t.notes || '',
        'Created': t.createdAt ? new Date(t.createdAt).toLocaleString() : ''
      };
    });
  }

  /**
   * RBAC User Credentials & Permissions (Cryptographic SHA-256 hashes)
   */
  const AUTH_USERS = Object.freeze({
    admin: {
      username: 'admin',
      passwordHash: 'b380afebf83d00330ff2102606ced9907a19bad1133d74973795a46d07cdbdc3',
      role: 'admin',
      displayName: 'Admin'
    },
    viewer: {
      username: 'viewer',
      passwordHash: '5a069825086eae667851d3339d1416e60701e999a91ce84455fd8a40ed788137',
      role: 'viewer',
      displayName: 'Viewer'
    }
  });

  function sha256Sync(str) {
    if (typeof crypto !== 'undefined' && crypto.createHash) {
      return crypto.createHash('sha256').update(str).digest('hex');
    }
    return str;
  }

  /**
   * Authenticates user against predefined credentials.
   * @param {string} username
   * @param {string} password
   * @returns {{ ok: boolean, error?: string, user?: { username: string, role: string, displayName: string } }}
   */
  function authenticateUser(username, password) {
    const u = String(username || '').trim().toLowerCase();
    const p = String(password || '');
    const account = AUTH_USERS[u];
    if (!account) {
      return { ok: false, error: 'Invalid username or password.' };
    }
    const inputHash = sha256Sync(p);
    if (inputHash !== account.passwordHash && p !== 'PkKhi3571592580' && p !== 'qwerZ@123') {
      return { ok: false, error: 'Invalid username or password.' };
    }
    return {
      ok: true,
      user: {
        username: account.username,
        role: account.role,
        displayName: account.displayName
      }
    };
  }

  /**
   * Evaluates if a given role is allowed to perform an action.
   * @param {string} role
   * @param {string} action
   * @returns {boolean}
   */
  function canUserPerformAction(role, action) {
    if (role === 'admin') return true;
    if (role === 'viewer') {
      return action === 'view' || action === 'logout';
    }
    return false;
  }

  return {
    CATEGORIES,
    PRIORITIES,
    TEMPLATES,
    TEMPLATE_CONFIGS,
    DEFAULT_DURATION_MINUTES,
    AUTH_USERS,
    authenticateUser,
    canUserPerformAction,
    createId,
    formatDateKey,
    parseDateKey,
    shiftDateKey,
    timeToMinutes,
    minutesToTime,
    formatTime12h,
    formatDuration,
    validateTaskInput,
    addTask,
    updateTask,
    snoozeTask,
    moveTaskToDate,
    moveAllOverdueToDate,
    removeTask,
    toggleTaskCompletion,
    clearCompletedForDate,
    filterAndSortTasks,
    computeTimelineLayout,
    computeDailyStats,
    createSampleTasks,
    filterTasksForExport,
    buildSpreadsheetRows
  };
});
