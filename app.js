(function () {
  'use strict';

  const Core = window.SchedulerCore;
  const STORAGE_KEY = 'daily_task_scheduler_v1';
  const THEME_KEY = 'daily_task_scheduler_theme_v1';
  const SCOPE_STORAGE_KEY = 'daily_task_scheduler_scope_v1';
  const HOUR_HEIGHT = 64;

  function loadActiveScope() {
    try {
      const saved = localStorage.getItem(SCOPE_STORAGE_KEY);
      if (saved === 'personal' || saved === 'work') return saved;
    } catch {
      // ignore
    }
    return 'work';
  }

  const state = {
    tasks: loadTasks(),
    selectedDate: Core.formatDateKey(new Date()),
    activeScope: loadActiveScope(), // 'work' | 'personal'
    view: 'list', // 'list' | 'timeline'
    filters: {
      status: 'all',
      category: 'all',
      priority: 'all',
      search: ''
    },
    timelineScrolledOnce: false
  };

  // Cached DOM references
  const els = {
    displayDateLabel: document.getElementById('displayDateLabel'),
    prevDayBtn: document.getElementById('prevDayBtn'),
    todayBtn: document.getElementById('todayBtn'),
    nextDayBtn: document.getElementById('nextDayBtn'),
    datePicker: document.getElementById('datePicker'),
    searchInput: document.getElementById('searchInput'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    topbarExportBtn: document.getElementById('topbarExportBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIconSun: document.getElementById('themeIconSun'),
    themeIconMoon: document.getElementById('themeIconMoon'),

    // Scope switcher in header & count badges
    scopeWorkBtn: document.getElementById('scopeWorkBtn'),
    scopePersonalBtn: document.getElementById('scopePersonalBtn'),
    workCountBadge: document.getElementById('workCountBadge'),
    personalCountBadge: document.getElementById('personalCountBadge'),

    // Quick add form
    quickAddForm: document.getElementById('quickAddForm'),
    quickScopeInput: document.getElementById('quickScope'),
    quickTitle: document.getElementById('quickTitle'),
    quickStart: document.getElementById('quickStart'),
    quickEnd: document.getElementById('quickEnd'),
    quickCategory: document.getElementById('quickCategory'),
    quickPriority: document.getElementById('quickPriority'),
    quickNotes: document.getElementById('quickNotes'),
    quickError: document.getElementById('quickError'),

    // Stats
    statPercent: document.getElementById('statPercent'),
    statProgressBar: document.getElementById('statProgressBar'),
    statCompleted: document.getElementById('statCompleted'),
    statScheduledTime: document.getElementById('statScheduledTime'),

    // Filters & Utilities
    statusButtons: Array.from(document.querySelectorAll('.seg-btn[data-status]')),
    filterCategory: document.getElementById('filterCategory'),
    filterPriority: document.getElementById('filterPriority'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    loadSampleBtn: document.getElementById('loadSampleBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importXlsxBtn: document.getElementById('importXlsxBtn'),
    importXlsxFileInput: document.getElementById('importXlsxFileInput'),
    topbarImportXlsxBtn: document.getElementById('topbarImportXlsxBtn'),
    toolbarImportXlsxBtn: document.getElementById('toolbarImportXlsxBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    importBtn: document.getElementById('importBtn'),
    importFileInput: document.getElementById('importFileInput'),

    // Main panel
    viewListBtn: document.getElementById('viewListBtn'),
    viewTimelineBtn: document.getElementById('viewTimelineBtn'),
    visibleCountLabel: document.getElementById('visibleCountLabel'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),

    // List view
    listView: document.getElementById('listView'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateText: document.getElementById('emptyStateText'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),
    emptySampleBtn: document.getElementById('emptySampleBtn'),
    overdueSection: document.getElementById('overdueSection'),
    overdueCount: document.getElementById('overdueCount'),
    overdueList: document.getElementById('overdueList'),
    moveAllOverdueBtn: document.getElementById('moveAllOverdueBtn'),
    scheduledSection: document.getElementById('scheduledSection'),
    scheduledCount: document.getElementById('scheduledCount'),
    scheduledList: document.getElementById('scheduledList'),
    anytimeSection: document.getElementById('anytimeSection'),
    anytimeCount: document.getElementById('anytimeCount'),
    anytimeList: document.getElementById('anytimeList'),

    // Timeline view
    timelineView: document.getElementById('timelineView'),
    timelineAnytimeStrip: document.getElementById('timelineAnytimeStrip'),
    timelineAnytimeChips: document.getElementById('timelineAnytimeChips'),
    timelineScroll: document.getElementById('timelineScroll'),
    timelineGrid: document.getElementById('timelineGrid'),

    // Modal
    taskModal: document.getElementById('taskModal'),
    modalHeading: document.getElementById('modalHeading'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    modalForm: document.getElementById('modalForm'),
    modalTaskId: document.getElementById('modalTaskId'),
    modalScopeInput: document.getElementById('modalScopeInput'),
    modalTitleInput: document.getElementById('modalTitleInput'),
    modalDateInput: document.getElementById('modalDateInput'),
    modalStartInput: document.getElementById('modalStartInput'),
    modalEndInput: document.getElementById('modalEndInput'),
    modalCategoryInput: document.getElementById('modalCategoryInput'),
    modalPriorityInput: document.getElementById('modalPriorityInput'),
    modalNotesInput: document.getElementById('modalNotesInput'),
    modalCompletedWrap: document.getElementById('modalCompletedWrap'),
    modalCompletedInput: document.getElementById('modalCompletedInput'),
    modalError: document.getElementById('modalError'),
    modalDeleteBtn: document.getElementById('modalDeleteBtn'),
    modalSnoozeBtn: document.getElementById('modalSnoozeBtn'),
    modalCancelBtn: document.getElementById('modalCancelBtn'),
    modalSubmitBtn: document.getElementById('modalSubmitBtn'),

    // Interactive template questionnaire modal
    templateModal: document.getElementById('templateModal'),
    templateModalIcon: document.getElementById('templateModalIcon'),
    templateModalTitle: document.getElementById('templateModalTitle'),
    templateModalDesc: document.getElementById('templateModalDesc'),
    closeTemplateModalBtn: document.getElementById('closeTemplateModalBtn'),
    templateForm: document.getElementById('templateForm'),
    templateFieldsContainer: document.getElementById('templateFieldsContainer'),
    templateError: document.getElementById('templateError'),
    cancelTemplateBtn: document.getElementById('cancelTemplateBtn'),
    submitTemplateBtn: document.getElementById('submitTemplateBtn'),

    // Streamlined Excel (.xlsx) Export Modal
    toolbarExportBtn: document.getElementById('toolbarExportBtn'),
    exportModal: document.getElementById('exportModal'),
    closeExportModalBtn: document.getElementById('closeExportModalBtn'),
    cancelExportBtn: document.getElementById('cancelExportBtn'),
    exportForm: document.getElementById('exportForm'),
    exportScopeAllBtn: document.getElementById('exportScopeAllBtn'),
    exportScopeRangeBtn: document.getElementById('exportScopeRangeBtn'),
    exportPresetPills: document.getElementById('exportPresetPills'),
    exportDateRangeFields: document.getElementById('exportDateRangeFields'),
    exportStartDate: document.getElementById('exportStartDate'),
    exportEndDate: document.getElementById('exportEndDate'),
    exportStatusFilter: document.getElementById('exportStatusFilter'),
    exportCategoryFilter: document.getElementById('exportCategoryFilter'),
    exportCountPreview: document.getElementById('exportCountPreview'),
    exportRangePreview: document.getElementById('exportRangePreview'),
    exportError: document.getElementById('exportError'),
    confirmExportBtn: document.getElementById('confirmExportBtn'),

    // RBAC Authentication
    loginOverlay: document.getElementById('loginOverlay'),
    loginForm: document.getElementById('loginForm'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    togglePasswordBtn: document.getElementById('togglePasswordBtn'),
    loginError: document.getElementById('loginError'),
    currentUserBadge: document.getElementById('currentUserBadge'),
    currentUsernameLabel: document.getElementById('currentUsernameLabel'),
    currentUserRoleTag: document.getElementById('currentUserRoleTag'),
    logoutBtn: document.getElementById('logoutBtn'),
    viewerBanner: document.getElementById('viewerBanner'),

    toastContainer: document.getElementById('toastContainer')
  };

  const AUTH_KEY = 'daily_task_scheduler_auth_v1';
  let currentUser = loadAuthUser();
  let activeTemplateKey = null;

  const exportOptions = {
    scope: 'all', // 'all' | 'range'
    preset: 'all',
    startDate: '',
    endDate: '',
    status: 'all',
    category: 'all'
  };

  /* -------------------- Persistence & Theme -------------------- */

  function loadAuthUser() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.username && (parsed.role === 'admin' || parsed.role === 'viewer')) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  function saveAuthUser(user) {
    try {
      if (user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    } catch {
      // ignore
    }
  }

  function applyAuthSession() {
    if (!currentUser) {
      els.loginOverlay.hidden = false;
      document.body.classList.remove('role-admin', 'role-viewer');
      els.viewerBanner.hidden = true;
      els.loginUsername.value = '';
      els.loginPassword.value = '';
      els.loginError.hidden = true;
      return;
    }

    els.loginOverlay.hidden = true;
    const isViewer = currentUser.role === 'viewer';

    if (isViewer) {
      document.body.classList.remove('role-admin');
      document.body.classList.add('role-viewer');
      els.viewerBanner.hidden = false;
      els.currentUserBadge.classList.add('role-viewer-badge');
      els.currentUsernameLabel.textContent = currentUser.username;
      els.currentUserRoleTag.textContent = 'Read-Only';
    } else {
      document.body.classList.remove('role-viewer');
      document.body.classList.add('role-admin');
      els.viewerBanner.hidden = true;
      els.currentUserBadge.classList.remove('role-viewer-badge');
      els.currentUsernameLabel.textContent = currentUser.username;
      els.currentUserRoleTag.textContent = 'Admin';
    }
  }

  /* -------------------- Codebase Storage & Server Sync -------------------- */

  let isSyncing = false;

  async function syncTasksFromServer() {
    if (isSyncing) return false;
    isSyncing = true;
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('API returned ' + res.status);
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.tasks)) {
        if (data.tasks.length > 0) {
          state.tasks = data.tasks;
          saveTasksLocally();
          render();
          return true;
        } else if (state.tasks && state.tasks.length > 0) {
          // If server returns empty list (e.g. fresh lambda), re-seed server from client!
          syncBulkToServer(state.tasks);
          return true;
        } else {
          // Both are empty; load sample tasks
          state.tasks = Core.createSampleTasks(state.selectedDate);
          saveTasksLocally();
          render();
          syncBulkToServer(state.tasks);
          return true;
        }
      }
    } catch {
      // Offline or static fallback: ensure tasks are never blank
      if (!state.tasks || state.tasks.length === 0) {
        state.tasks = Core.createSampleTasks(state.selectedDate);
        saveTasksLocally();
        render();
      }
    } finally {
      isSyncing = false;
    }
    return false;
  }

  async function pushTaskToServer(task) {
    if (!task) return;
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
    } catch {
      // Offline fallback
    }
  }

  async function syncBulkToServer(tasks) {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: tasks || [] })
      });
    } catch {
      // Offline fallback
    }
  }

  async function deleteTaskFromServer(id) {
    if (!id) return;
    try {
      await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch {
      // Offline fallback
    }
  }

  function loadTasks() {
    const todayKey = Core.formatDateKey(new Date());
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return Core.createSampleTasks(todayKey);
  }

  function saveTasksLocally() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch {
      // ignore
    }
  }

  function saveTasks() {
    saveTasksLocally();
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      saved = null;
    }
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    els.themeIconSun.hidden = !isDark;
    els.themeIconMoon.hidden = isDark;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage failures
    }
  }

  /* -------------------- Work vs Personal Scope Switcher -------------------- */

  function setActiveScope(scope) {
    const clean = scope === 'personal' ? 'personal' : 'work';
    state.activeScope = clean;
    try {
      localStorage.setItem(SCOPE_STORAGE_KEY, clean);
    } catch {
      // ignore
    }

    if (els.scopeWorkBtn && els.scopePersonalBtn) {
      els.scopeWorkBtn.classList.toggle('active', clean === 'work');
      els.scopePersonalBtn.classList.toggle('active', clean === 'personal');
      els.scopeWorkBtn.setAttribute('aria-selected', String(clean === 'work'));
      els.scopePersonalBtn.setAttribute('aria-selected', String(clean === 'personal'));
    }

    setFormScope('quick', clean);
    render();
  }

  function setFormScope(target, scope) {
    const clean = scope === 'personal' ? 'personal' : 'work';
    if (target === 'quick') {
      if (els.quickScopeInput) els.quickScopeInput.value = clean;
      document.querySelectorAll('.scope-form-btn[data-scope-target="quick"]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.scope === clean);
      });
      if (clean === 'personal' && els.quickCategory) {
        const workCats = ['support', 'shipping', 'telecom', 'hardware', 'supplies'];
        if (workCats.includes(els.quickCategory.value)) {
          els.quickCategory.value = 'personal';
        }
      } else if (clean === 'work' && els.quickCategory) {
        const personalCats = ['personal', 'errands', 'health', 'finance', 'learning'];
        if (personalCats.includes(els.quickCategory.value)) {
          els.quickCategory.value = 'support';
        }
      }
    } else if (target === 'modal') {
      if (els.modalScopeInput) els.modalScopeInput.value = clean;
      document.querySelectorAll('.scope-form-btn[data-scope-target="modal"]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.scope === clean);
      });
      if (clean === 'personal' && els.modalCategoryInput) {
        const workCats = ['support', 'shipping', 'telecom', 'hardware', 'supplies'];
        if (workCats.includes(els.modalCategoryInput.value)) {
          els.modalCategoryInput.value = 'personal';
        }
      } else if (clean === 'work' && els.modalCategoryInput) {
        const personalCats = ['personal', 'errands', 'health', 'finance', 'learning'];
        if (personalCats.includes(els.modalCategoryInput.value)) {
          els.modalCategoryInput.value = 'support';
        }
      }
    }
  }

  /* -------------------- Date & Time Formatting -------------------- */

  function formatDisplayDate(dateKey) {
    const dt = Core.parseDateKey(dateKey);
    if (!dt) return dateKey;
    const todayKey = Core.formatDateKey(new Date());
    const tomorrowKey = Core.shiftDateKey(todayKey, 1);
    const yesterdayKey = Core.shiftDateKey(todayKey, -1);

    const formatted = dt.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (dateKey === todayKey) return `Today — ${formatted}`;
    if (dateKey === tomorrowKey) return `Tomorrow — ${formatted}`;
    if (dateKey === yesterdayKey) return `Yesterday — ${formatted}`;
    return formatted;
  }

  function formatShortDate(dateKey) {
    const dt = Core.parseDateKey(dateKey);
    if (!dt) return dateKey;
    const todayKey = Core.formatDateKey(new Date());
    const yesterdayKey = Core.shiftDateKey(todayKey, -1);
    if (dateKey === yesterdayKey) return 'Yesterday';
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function applyDurationPreset(startInput, endInput, durationMinutes) {
    if (durationMinutes === 0) {
      startInput.value = '';
      endInput.value = '';
      return;
    }

    let startMins = Core.timeToMinutes(startInput.value);
    if (startMins === null) {
      const now = new Date();
      // Round up to next 30-minute boundary for convenience
      const total = now.getHours() * 60 + now.getMinutes();
      startMins = Math.min(23 * 60, Math.ceil(total / 30) * 30);
      startInput.value = Core.minutesToTime(startMins);
    }

    const endMins = Math.min(23 * 60 + 59, startMins + durationMinutes);
    endInput.value = Core.minutesToTime(endMins);
  }

  /* -------------------- Notifications -------------------- */

  function showToast(message, undoCallback) {
    const toast = document.createElement('div');
    toast.className = 'toast';

    const span = document.createElement('span');
    span.textContent = message;
    toast.appendChild(span);

    let timerId = null;

    function dismiss() {
      if (timerId) clearTimeout(timerId);
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }

    if (typeof undoCallback === 'function') {
      const undoBtn = document.createElement('button');
      undoBtn.type = 'button';
      undoBtn.className = 'toast-undo';
      undoBtn.textContent = 'Undo';
      undoBtn.addEventListener('click', () => {
        undoCallback();
        dismiss();
      });
      toast.appendChild(undoBtn);
    }

    els.toastContainer.appendChild(toast);
    timerId = setTimeout(dismiss, undoCallback ? 6000 : 3200);
  }

  /* -------------------- Task Mutations -------------------- */

  function handleAddTask(input, errorEl) {
    const res = Core.addTask(state.tasks, input);
    if (!res.ok) {
      errorEl.textContent = res.errors.join(' ');
      errorEl.hidden = false;
      return false;
    }
    errorEl.hidden = true;
    state.tasks = res.tasks;
    saveTasks();
    const taskScope = res.task.scope === 'personal' ? 'personal' : 'work';
    if (taskScope !== state.activeScope) {
      setActiveScope(taskScope);
    } else {
      render();
    }
    pushTaskToServer(res.task);
    showToast(`Added "${res.task.title}" (${taskScope === 'personal' ? '👤 Personal' : '💼 Work'})`);
    return true;
  }

  function handleEditTask(id, patch, errorEl) {
    const res = Core.updateTask(state.tasks, id, patch);
    if (!res.ok) {
      errorEl.textContent = res.errors.join(' ');
      errorEl.hidden = false;
      return false;
    }
    errorEl.hidden = true;
    state.tasks = res.tasks;
    saveTasks();
    const taskScope = res.task.scope === 'personal' ? 'personal' : 'work';
    if (taskScope !== state.activeScope) {
      setActiveScope(taskScope);
    } else {
      render();
    }
    pushTaskToServer(res.task);
    showToast(`Updated "${res.task.title}"`);
    return true;
  }

  function handleDeleteTask(id) {
    const previousTasks = state.tasks.slice();
    const res = Core.removeTask(state.tasks, id);
    if (!res.ok || !res.removed) return;
    state.tasks = res.tasks;
    saveTasks();
    render();
    deleteTaskFromServer(id);

    showToast(`Removed "${res.removed.title}"`, () => {
      state.tasks = previousTasks;
      saveTasks();
      render();
      pushTaskToServer(res.removed);
      showToast(`Restored "${res.removed.title}"`);
    });
  }

  function handleSnoozeTask(id, hours) {
    const res = Core.snoozeTask(state.tasks, id, hours || 2);
    if (!res.ok) return;
    state.tasks = res.tasks;
    saveTasks();
    render();
    pushTaskToServer(res.task);
    showToast(`Follow-up scheduled for ${Core.formatTime12h(res.task.startTime)} (+${hours || 2}h)`);
  }

  function handleMoveTaskToDate(id, targetDate) {
    const res = Core.moveTaskToDate(state.tasks, id, targetDate);
    if (!res.ok) return;
    state.tasks = res.tasks;
    saveTasks();
    render();
    pushTaskToServer(res.task);
    showToast(`Moved "${res.task.title}" to ${formatDisplayDate(targetDate)}`);
  }

  function handleMoveAllOverdueToDate() {
    const res = Core.moveAllOverdueToDate(state.tasks, state.selectedDate, state.activeScope);
    if (!res.ok || res.movedCount === 0) return;
    state.tasks = res.tasks;
    saveTasks();
    render();
    syncBulkToServer(state.tasks);
    const scopeLabel = state.activeScope === 'personal' ? 'personal ' : 'work ';
    showToast(`Moved ${res.movedCount} overdue ${scopeLabel}task${res.movedCount === 1 ? '' : 's'} to ${formatDisplayDate(state.selectedDate)}`);
  }

  function handleToggleTask(id) {
    const res = Core.toggleTaskCompletion(state.tasks, id);
    if (!res.ok) return;
    state.tasks = res.tasks;
    saveTasks();
    render();
    pushTaskToServer(res.task);
  }

  function handleClearCompleted() {
    const previousTasks = state.tasks.slice();
    const res = Core.clearCompletedForDate(state.tasks, state.selectedDate, state.activeScope);
    if (res.removedCount === 0) return;
    state.tasks = res.tasks;
    saveTasks();
    render();
    syncBulkToServer(state.tasks);

    const scopeLabel = state.activeScope === 'personal' ? 'personal ' : 'work ';
    showToast(`Cleared ${res.removedCount} completed ${scopeLabel}task${res.removedCount === 1 ? '' : 's'}`, () => {
      state.tasks = previousTasks;
      saveTasks();
      render();
      syncBulkToServer(state.tasks);
      showToast('Restored cleared tasks');
    });
  }

  function openTemplatePromptModal(templateKey) {
    const config = Core.TEMPLATE_CONFIGS && Core.TEMPLATE_CONFIGS[templateKey];
    if (!config) return;

    activeTemplateKey = templateKey;
    els.templateModalIcon.textContent = config.icon;
    els.templateModalTitle.textContent = `New ${config.name}`;
    els.templateModalDesc.textContent = config.description || 'Fill in the details below to create this task.';
    els.templateError.hidden = true;
    els.templateFieldsContainer.replaceChildren();

    config.fields.forEach((field, index) => {
      const wrap = document.createElement('div');
      wrap.className = 'field';

      const label = document.createElement('label');
      label.setAttribute('for', `tpl_field_${field.key}`);
      label.textContent = field.label;
      if (field.required) {
        const reqSpan = document.createElement('span');
        reqSpan.className = 'template-field-label-req';
        reqSpan.textContent = ' *';
        label.appendChild(reqSpan);
      }
      wrap.appendChild(label);

      let input;
      if (field.type === 'select') {
        input = document.createElement('select');
        (field.options || []).forEach((opt) => {
          const optEl = document.createElement('option');
          optEl.value = opt;
          optEl.textContent = `${opt} hour${opt === '1' ? '' : 's'}`;
          if (opt === (field.defaultValue || '2')) optEl.selected = true;
          input.appendChild(optEl);
        });
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.placeholder = field.placeholder || '';
        if (field.defaultValue) input.value = field.defaultValue;
      }

      input.id = `tpl_field_${field.key}`;
      input.dataset.key = field.key;
      if (field.required) input.required = true;

      wrap.appendChild(input);
      els.templateFieldsContainer.appendChild(wrap);

      if (index === 0) {
        setTimeout(() => input.focus(), 60);
      }
    });

    els.templateModal.hidden = false;
  }

  function closeTemplateModal() {
    els.templateModal.hidden = true;
    els.templateError.hidden = true;
    activeTemplateKey = null;
  }

  /* -------------------- Excel (.xlsx) Export -------------------- */

  function setExportScope(scope) {
    exportOptions.scope = scope;
    const isRange = scope === 'range';
    els.exportScopeAllBtn.classList.toggle('active', !isRange);
    els.exportScopeRangeBtn.classList.toggle('active', isRange);
    els.exportDateRangeFields.hidden = !isRange;
    updateExportPreview();
  }

  function applyExportPreset(preset) {
    exportOptions.preset = preset;
    const todayKey = Core.formatDateKey(new Date());

    els.exportPresetPills.querySelectorAll('.pill-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === preset);
    });

    if (preset === 'all') {
      setExportScope('all');
      return;
    }

    setExportScope('range');
    if (preset === 'today') {
      exportOptions.startDate = todayKey;
      exportOptions.endDate = todayKey;
    } else if (preset === 'yesterday') {
      const yest = Core.shiftDateKey(todayKey, -1);
      exportOptions.startDate = yest;
      exportOptions.endDate = yest;
    } else if (preset === 'last7') {
      exportOptions.startDate = Core.shiftDateKey(todayKey, -6);
      exportOptions.endDate = todayKey;
    } else if (preset === 'month') {
      const dt = Core.parseDateKey(todayKey) || new Date();
      const firstOfMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-01`;
      exportOptions.startDate = firstOfMonth;
      exportOptions.endDate = todayKey;
    }

    els.exportStartDate.value = exportOptions.startDate;
    els.exportEndDate.value = exportOptions.endDate;
    updateExportPreview();
  }

  function updateExportPreview() {
    exportOptions.startDate = els.exportStartDate.value;
    exportOptions.endDate = els.exportEndDate.value;
    exportOptions.status = els.exportStatusFilter.value;
    exportOptions.category = els.exportCategoryFilter.value;

    const matching = Core.filterTasksForExport(state.tasks, {
      rangeType: exportOptions.scope,
      startDate: exportOptions.startDate,
      endDate: exportOptions.endDate,
      status: exportOptions.status,
      category: exportOptions.category
    });

    const count = matching.length;
    els.exportCountPreview.textContent = `${count} task${count === 1 ? '' : 's'}`;

    if (exportOptions.scope === 'all') {
      els.exportRangePreview.textContent = 'All recorded tasks (All Time)';
    } else if (exportOptions.startDate && exportOptions.endDate) {
      if (exportOptions.startDate === exportOptions.endDate) {
        els.exportRangePreview.textContent = `Date: ${formatDisplayDate(exportOptions.startDate)}`;
      } else {
        els.exportRangePreview.textContent = `Range: ${exportOptions.startDate} to ${exportOptions.endDate}`;
      }
    } else if (exportOptions.startDate) {
      els.exportRangePreview.textContent = `From ${exportOptions.startDate} onwards`;
    } else if (exportOptions.endDate) {
      els.exportRangePreview.textContent = `Up to ${exportOptions.endDate}`;
    } else {
      els.exportRangePreview.textContent = 'Select start and end dates';
    }

    els.confirmExportBtn.disabled = count === 0;
    els.exportError.hidden = count > 0;
    if (count === 0) {
      els.exportError.textContent = 'No tasks match the selected export criteria.';
    }
  }

  function openExportModal() {
    const todayKey = Core.formatDateKey(new Date());
    els.exportStartDate.value = state.selectedDate || todayKey;
    els.exportEndDate.value = state.selectedDate || todayKey;
    exportOptions.startDate = els.exportStartDate.value;
    exportOptions.endDate = els.exportEndDate.value;
    els.exportStatusFilter.value = 'all';
    els.exportCategoryFilter.value = 'all';

    applyExportPreset('all');
    els.exportModal.hidden = false;
  }

  function closeExportModal() {
    els.exportModal.hidden = true;
    els.exportError.hidden = true;
  }

  function executeExcelExport() {
    if (typeof XLSX === 'undefined') {
      showToast('Excel exporter library is loading, please try again in a moment.');
      return;
    }

    const matching = Core.filterTasksForExport(state.tasks, {
      rangeType: exportOptions.scope,
      startDate: exportOptions.startDate,
      endDate: exportOptions.endDate,
      status: exportOptions.status,
      category: exportOptions.category
    });

    if (matching.length === 0) {
      els.exportError.textContent = 'No tasks found to export in this range.';
      els.exportError.hidden = false;
      return;
    }

    const rows = Core.buildSpreadsheetRows(matching);
    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet['!cols'] = [
      { wch: 13 }, // Date
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 46 }, // Task Title
      { wch: 24 }, // Category
      { wch: 12 }, // Priority
      { wch: 14 }, // Status
      { wch: 48 }, // Notes / Details
      { wch: 22 }  // Created
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

    let filename = 'dayflow-tasks';
    if (exportOptions.scope === 'range' && exportOptions.startDate) {
      filename += `-${exportOptions.startDate}`;
      if (exportOptions.endDate && exportOptions.endDate !== exportOptions.startDate) {
        filename += `_to_${exportOptions.endDate}`;
      }
    } else {
      filename += `-all-time-${Core.formatDateKey(new Date())}`;
    }
    filename += '.xlsx';

    try {
      if (typeof XLSX.writeFile === 'function') {
        XLSX.writeFile(workbook, filename);
      } else {
        const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1000);
      }
      closeExportModal();
      showToast(`Exported ${matching.length} tasks to ${filename} (Downloads)`);
    } catch (err) {
      els.exportError.textContent = 'Export failed: ' + (err.message || String(err));
      els.exportError.hidden = false;
    }
  }

  /* -------------------- Modal Handling -------------------- */

  function openAddModal(defaults) {
    const opts = defaults || {};
    const defaultScope = opts.scope || state.activeScope || 'work';
    setFormScope('modal', defaultScope);

    els.modalTaskId.value = '';
    els.modalHeading.textContent = 'Add Task';
    els.modalSubmitBtn.textContent = 'Add Task';
    els.modalTitleInput.value = opts.title || '';
    els.modalDateInput.value = opts.date || state.selectedDate;
    els.modalStartInput.value = opts.startTime || '';
    els.modalEndInput.value = opts.endTime || '';
    els.modalCategoryInput.value = opts.category || (defaultScope === 'personal' ? 'personal' : 'support');
    els.modalPriorityInput.value = opts.priority || 'medium';
    els.modalNotesInput.value = opts.notes || '';
    els.modalCompletedInput.checked = false;
    els.modalCompletedWrap.hidden = true;
    els.modalDeleteBtn.hidden = true;
    els.modalSnoozeBtn.hidden = true;
    els.modalError.hidden = true;

    els.taskModal.hidden = false;
    els.modalTitleInput.focus();
  }

  function openEditModal(taskId) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const taskScope = task.scope === 'personal' ? 'personal' : 'work';
    setFormScope('modal', taskScope);

    els.modalTaskId.value = task.id;
    els.modalHeading.textContent = 'Edit Task';
    els.modalSubmitBtn.textContent = 'Save Changes';
    els.modalTitleInput.value = task.title;
    els.modalDateInput.value = task.date;
    els.modalStartInput.value = task.startTime;
    els.modalEndInput.value = task.endTime;
    els.modalCategoryInput.value = task.category;
    els.modalPriorityInput.value = task.priority;
    els.modalNotesInput.value = task.notes || '';
    els.modalCompletedInput.checked = Boolean(task.completed);
    els.modalCompletedWrap.hidden = false;
    els.modalDeleteBtn.hidden = false;
    els.modalSnoozeBtn.hidden = false;
    els.modalError.hidden = true;

    els.taskModal.hidden = false;
    els.modalTitleInput.focus();
  }

  function closeModal() {
    els.taskModal.hidden = true;
    els.modalError.hidden = true;
  }

  /* -------------------- Rendering Helpers -------------------- */

  function createSvgIcon(pathMarkup, size) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(size || 15));
    svg.setAttribute('height', String(size || 15));
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.innerHTML = pathMarkup;
    return svg;
  }

  const EDIT_ICON = '<path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>';
  const DELETE_ICON = '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>';

  function buildTaskCard(task) {
    const cat = Core.CATEGORIES[task.category] || Core.CATEGORIES.work;
    const prio = Core.PRIORITIES[task.priority] || Core.PRIORITIES.medium;

    const card = document.createElement('article');
    card.className = 'task-card' + (task.completed ? ' is-completed' : '');
    card.style.setProperty('--cat-color', cat.color);
    card.dataset.taskId = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = Boolean(task.completed);
    checkbox.setAttribute('aria-label', `Mark "${task.title}" as ${task.completed ? 'pending' : 'completed'}`);
    checkbox.addEventListener('change', () => handleToggleTask(task.id));

    const body = document.createElement('div');
    body.className = 'task-body';
    body.title = 'Click to edit task';
    body.addEventListener('click', () => openEditModal(task.id));

    const top = document.createElement('div');
    top.className = 'task-top';

    const titleEl = document.createElement('span');
    titleEl.className = 'task-title';
    titleEl.textContent = task.title;
    top.appendChild(titleEl);

    const taskScope = task.scope === 'personal' ? 'personal' : 'work';
    const scopeTag = document.createElement('span');
    scopeTag.className = `task-scope-tag scope-${taskScope}`;
    scopeTag.textContent = taskScope === 'personal' ? '👤 Personal' : '💼 Work';
    top.appendChild(scopeTag);

    const prioBadge = document.createElement('span');
    prioBadge.className = `prio-badge prio-${task.priority}`;
    prioBadge.textContent = prio.label;
    top.appendChild(prioBadge);

    body.appendChild(top);

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    if (task.date < state.selectedDate && !task.completed) {
      const rolloverBadge = document.createElement('span');
      rolloverBadge.className = 'rollover-badge';
      rolloverBadge.textContent = `Rolled over (${formatShortDate(task.date)})`;
      meta.appendChild(rolloverBadge);
    }

    if (task.startTime) {
      const startMins = Core.timeToMinutes(task.startTime);
      const endMins = Core.timeToMinutes(task.endTime);
      const timeBadge = document.createElement('span');
      timeBadge.className = 'time-badge';
      const durationStr =
        startMins !== null && endMins !== null && endMins > startMins
          ? ` (${Core.formatDuration(endMins - startMins)})`
          : '';
      timeBadge.textContent = `${Core.formatTime12h(task.startTime)} - ${Core.formatTime12h(task.endTime)}${durationStr}`;
      meta.appendChild(timeBadge);
    } else {
      const anytimeBadge = document.createElement('span');
      anytimeBadge.className = 'time-badge';
      anytimeBadge.textContent = 'Anytime';
      meta.appendChild(anytimeBadge);
    }

    const catBadge = document.createElement('span');
    catBadge.className = 'cat-badge';
    const dot = document.createElement('span');
    dot.className = 'cat-dot';
    dot.style.background = cat.color;
    const catText = document.createElement('span');
    catText.textContent = cat.label;
    catBadge.appendChild(dot);
    catBadge.appendChild(catText);
    meta.appendChild(catBadge);

    body.appendChild(meta);

    if (task.notes) {
      const notesEl = document.createElement('div');
      notesEl.className = 'task-notes';
      const lines = String(task.notes).split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const lineEl = document.createElement('div');
        lineEl.className = 'note-line';
        const match = /^([A-Za-z0-9\s#/-]+):(.*)$/.exec(trimmed);
        if (match) {
          const keySpan = document.createElement('span');
          keySpan.className = 'note-key';
          keySpan.textContent = match[1].trim() + ':';
          const valSpan = document.createElement('span');
          valSpan.className = 'note-val';
          valSpan.textContent = match[2].trim();
          lineEl.appendChild(keySpan);
          lineEl.appendChild(valSpan);
        } else {
          lineEl.textContent = trimmed;
        }
        notesEl.appendChild(lineEl);
      });
      body.appendChild(notesEl);
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    if (task.date !== state.selectedDate) {
      const moveTodayBtn = document.createElement('button');
      moveTodayBtn.type = 'button';
      moveTodayBtn.className = 'move-today-btn';
      moveTodayBtn.title = `Move task date to ${formatDisplayDate(state.selectedDate)}`;
      moveTodayBtn.textContent = '→ Today';
      moveTodayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleMoveTaskToDate(task.id, state.selectedDate);
      });
      actions.appendChild(moveTodayBtn);
    }

    const snoozeBtn = document.createElement('button');
    snoozeBtn.type = 'button';
    snoozeBtn.className = 'snooze-btn';
    snoozeBtn.title = 'Reschedule / Follow up in 2 hours';
    snoozeBtn.textContent = '+2h';
    snoozeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSnoozeTask(task.id, 2);
    });

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'icon-btn';
    editBtn.title = 'Edit task';
    editBtn.setAttribute('aria-label', `Edit "${task.title}"`);
    editBtn.appendChild(createSvgIcon(EDIT_ICON, 15));
    editBtn.addEventListener('click', () => openEditModal(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn danger';
    deleteBtn.title = 'Remove task';
    deleteBtn.setAttribute('aria-label', `Remove "${task.title}"`);
    deleteBtn.appendChild(createSvgIcon(DELETE_ICON, 15));
    deleteBtn.addEventListener('click', () => handleDeleteTask(task.id));

    actions.appendChild(snoozeBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(checkbox);
    card.appendChild(body);
    card.appendChild(actions);
    return card;
  }

  function renderStats() {
    const stats = Core.computeDailyStats(state.tasks, state.selectedDate, state.activeScope);
    els.statPercent.textContent = `${stats.completionRate}%`;
    els.statProgressBar.style.width = `${stats.completionRate}%`;
    els.statCompleted.textContent = `${stats.completed} / ${stats.totalWithOverdue}`;
    if (stats.overdueCount > 0) {
      els.statCompleted.textContent += ` (${stats.overdueCount} rolled over)`;
    }
    els.statScheduledTime.textContent = Core.formatDuration(stats.scheduledMinutes);
    els.clearCompletedBtn.hidden = stats.completed === 0;
  }

  function renderListView(grouped) {
    const totalVisible = grouped.all.length;
    const hasAnyForDate = state.tasks.some((t) => {
      const s = t.scope === 'personal' ? 'personal' : 'work';
      return t.date === state.selectedDate && s === state.activeScope;
    });

    els.emptyState.hidden = totalVisible > 0;
    if (totalVisible === 0) {
      const scopeName = state.activeScope === 'personal' ? 'Personal' : 'Work';
      if (hasAnyForDate) {
        els.emptyStateTitle.textContent = `No ${scopeName.toLowerCase()} tasks match your filters`;
        els.emptyStateText.textContent = 'Try clearing search or filter criteria to see your scheduled tasks.';
        els.emptySampleBtn.hidden = true;
      } else {
        els.emptyStateTitle.textContent = `No ${scopeName.toLowerCase()} tasks scheduled for this day`;
        els.emptyStateText.textContent = `Add a ${scopeName.toLowerCase()} task from the panel on the left or click below to plan your day.`;
        els.emptySampleBtn.hidden = state.activeScope === 'personal';
      }
    }

    const overdueList = grouped.overdue || [];
    els.overdueList.replaceChildren(...overdueList.map(buildTaskCard));
    els.overdueCount.textContent = String(overdueList.length);
    els.overdueSection.hidden = overdueList.length === 0;

    els.scheduledList.replaceChildren(...grouped.scheduled.map(buildTaskCard));
    els.scheduledCount.textContent = String(grouped.scheduled.length);
    els.scheduledSection.hidden = grouped.scheduled.length === 0;

    els.anytimeList.replaceChildren(...grouped.anytime.map(buildTaskCard));
    els.anytimeCount.textContent = String(grouped.anytime.length);
    els.anytimeSection.hidden = grouped.anytime.length === 0;
  }

  function renderTimelineView(grouped) {
    // Render anytime and rolled-over strip
    const anytimeItems = [...(grouped.overdue || []), ...(grouped.anytime || [])];
    els.timelineAnytimeStrip.hidden = anytimeItems.length === 0;
    els.timelineAnytimeChips.replaceChildren(
      ...anytimeItems.map((task) => {
        const cat = Core.CATEGORIES[task.category] || Core.CATEGORIES.support;
        const chip = document.createElement('div');
        chip.className = 'anytime-chip' + (task.completed ? ' is-completed' : '');
        chip.style.setProperty('--cat-color', cat.color);

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = Boolean(task.completed);
        cb.setAttribute('aria-label', `Complete "${task.title}"`);
        cb.addEventListener('change', () => handleToggleTask(task.id));

        const titleSpan = document.createElement('span');
        titleSpan.className = 'anytime-chip-title';
        const prefix = task.date < state.selectedDate ? `[${formatShortDate(task.date)}] ` : '';
        titleSpan.textContent = prefix + task.title;
        titleSpan.addEventListener('click', () => openEditModal(task.id));

        chip.appendChild(cb);
        chip.appendChild(titleSpan);

        if (task.date !== state.selectedDate) {
          const moveBtn = document.createElement('button');
          moveBtn.type = 'button';
          moveBtn.className = 'mini-btn';
          moveBtn.title = `Move to ${formatDisplayDate(state.selectedDate)}`;
          moveBtn.textContent = '→ Today';
          moveBtn.addEventListener('click', () => handleMoveTaskToDate(task.id, state.selectedDate));
          chip.appendChild(moveBtn);
        }

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'mini-btn';
        editBtn.title = 'Edit task';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => openEditModal(task.id));

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'mini-btn danger';
        delBtn.title = 'Remove task';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', () => handleDeleteTask(task.id));

        chip.appendChild(editBtn);
        chip.appendChild(delBtn);
        return chip;
      })
    );

    // Build 24-hour background rows
    const fragment = document.createDocumentFragment();
    for (let hour = 0; hour < 24; hour++) {
      const row = document.createElement('div');
      row.className = 'timeline-hour-row';
      row.dataset.hour = String(hour);
      const startStr = `${String(hour).padStart(2, '0')}:00`;
      const endStr = hour === 23 ? '23:59' : `${String(hour + 1).padStart(2, '0')}:00`;
      row.title = `Click to add task at ${Core.formatTime12h(startStr)}`;
      row.addEventListener('click', () => {
        openAddModal({ date: state.selectedDate, startTime: startStr, endTime: endStr });
      });

      const label = document.createElement('span');
      label.className = 'timeline-hour-label';
      label.textContent = Core.formatTime12h(startStr).replace(':00 ', ' ');
      row.appendChild(label);
      fragment.appendChild(row);
    }

    // Events overlay layer
    const eventsLayer = document.createElement('div');
    eventsLayer.className = 'timeline-events-layer';

    const layoutItems = Core.computeTimelineLayout(grouped.scheduled);
    for (const item of layoutItems) {
      const { task, startMins, endMins, col, totalCols } = item;
      const cat = Core.CATEGORIES[task.category] || Core.CATEGORIES.work;
      const topPx = (startMins / 60) * HOUR_HEIGHT;
      const rawHeight = ((endMins - startMins) / 60) * HOUR_HEIGHT;
      const heightPx = Math.max(28, rawHeight - 2);
      const widthPct = 100 / totalCols;
      const leftPct = col * widthPct;

      const block = document.createElement('div');
      block.className = 'timeline-block' + (task.completed ? ' is-completed' : '');
      block.style.setProperty('--cat-color', cat.color);
      block.style.top = `${topPx}px`;
      block.style.height = `${heightPx}px`;
      block.style.left = `calc(${leftPct}% + 2px)`;
      block.style.width = `calc(${widthPct}% - 4px)`;
      block.addEventListener('click', (e) => {
        if (e.target.closest('input, button')) return;
        openEditModal(task.id);
      });

      const header = document.createElement('div');
      header.className = 'timeline-block-header';

      const main = document.createElement('div');
      main.className = 'timeline-block-main';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = Boolean(task.completed);
      cb.setAttribute('aria-label', `Complete "${task.title}"`);
      cb.addEventListener('change', () => handleToggleTask(task.id));

      const title = document.createElement('span');
      title.className = 'timeline-block-title';
      title.textContent = task.title;

      main.appendChild(cb);
      main.appendChild(title);

      const actions = document.createElement('div');
      actions.className = 'timeline-block-actions';

      const snoozeBtn = document.createElement('button');
      snoozeBtn.type = 'button';
      snoozeBtn.className = 'mini-btn';
      snoozeBtn.title = 'Reschedule +2h';
      snoozeBtn.textContent = '+2h';
      snoozeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSnoozeTask(task.id, 2);
      });

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'mini-btn';
      editBtn.title = 'Edit task';
      editBtn.appendChild(createSvgIcon(EDIT_ICON, 13));
      editBtn.addEventListener('click', () => openEditModal(task.id));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'mini-btn danger';
      delBtn.title = 'Remove task';
      delBtn.appendChild(createSvgIcon(DELETE_ICON, 13));
      delBtn.addEventListener('click', () => handleDeleteTask(task.id));

      actions.appendChild(snoozeBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      header.appendChild(main);
      header.appendChild(actions);
      block.appendChild(header);

      if (heightPx >= 44) {
        const timeEl = document.createElement('div');
        timeEl.className = 'timeline-block-time';
        timeEl.textContent = `${Core.formatTime12h(task.startTime)} – ${Core.formatTime12h(task.endTime)}`;
        block.appendChild(timeEl);
      }

      eventsLayer.appendChild(block);
    }

    // Current time indicator when viewing Today
    if (state.selectedDate === Core.formatDateKey(new Date())) {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const indicator = document.createElement('div');
      indicator.className = 'now-indicator';
      indicator.style.top = `${(mins / 60) * HOUR_HEIGHT}px`;
      eventsLayer.appendChild(indicator);
    }

    fragment.appendChild(eventsLayer);
    els.timelineGrid.replaceChildren(fragment);

    if (!state.timelineScrolledOnce) {
      const targetHour =
        state.selectedDate === Core.formatDateKey(new Date())
          ? Math.max(0, new Date().getHours() - 2)
          : 7;
      els.timelineScroll.scrollTop = targetHour * HOUR_HEIGHT;
      state.timelineScrolledOnce = true;
    }
  }

  function render() {
    els.datePicker.value = state.selectedDate;
    els.displayDateLabel.textContent = formatDisplayDate(state.selectedDate);

    // Compute scope counts for header badges
    const workStats = Core.computeDailyStats(state.tasks, state.selectedDate, 'work');
    const personalStats = Core.computeDailyStats(state.tasks, state.selectedDate, 'personal');
    if (els.workCountBadge) els.workCountBadge.textContent = String(workStats.totalWithOverdue);
    if (els.personalCountBadge) els.personalCountBadge.textContent = String(personalStats.totalWithOverdue);

    // Update active state on header scope switcher buttons
    if (els.scopeWorkBtn && els.scopePersonalBtn) {
      els.scopeWorkBtn.classList.toggle('active', state.activeScope === 'work');
      els.scopePersonalBtn.classList.toggle('active', state.activeScope === 'personal');
      els.scopeWorkBtn.setAttribute('aria-selected', String(state.activeScope === 'work'));
      els.scopePersonalBtn.setAttribute('aria-selected', String(state.activeScope === 'personal'));
    }

    const grouped = Core.filterAndSortTasks(state.tasks, {
      date: state.selectedDate,
      scope: state.activeScope,
      ...state.filters
    });

    const count = grouped.all.length;
    const scopeLabel = state.activeScope === 'personal' ? 'Personal' : 'Work';
    els.visibleCountLabel.textContent = `${count} ${scopeLabel} task${count === 1 ? '' : 's'}`;

    renderStats();
    renderListView(grouped);
    if (state.view === 'timeline') {
      renderTimelineView(grouped);
    }
  }

  /* -------------------- Event Wiring -------------------- */

  function setView(view) {
    state.view = view;
    const isList = view === 'list';
    els.listView.hidden = !isList;
    els.timelineView.hidden = isList;
    els.viewListBtn.classList.toggle('active', isList);
    els.viewTimelineBtn.classList.toggle('active', !isList);
    els.viewListBtn.setAttribute('aria-selected', String(isList));
    els.viewTimelineBtn.setAttribute('aria-selected', String(!isList));
    render();
  }

  function wireEvents() {
    // Scope Switcher (Header)
    if (els.scopeWorkBtn) {
      els.scopeWorkBtn.addEventListener('click', () => setActiveScope('work'));
    }
    if (els.scopePersonalBtn) {
      els.scopePersonalBtn.addEventListener('click', () => setActiveScope('personal'));
    }

    // Scope form segmented buttons (Quick Add & Modal)
    document.querySelectorAll('.scope-form-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.scopeTarget || 'quick';
        const scope = btn.dataset.scope || 'work';
        setFormScope(target, scope);
      });
    });

    // Date navigation
    els.prevDayBtn.addEventListener('click', () => {
      state.selectedDate = Core.shiftDateKey(state.selectedDate, -1);
      render();
    });
    els.nextDayBtn.addEventListener('click', () => {
      state.selectedDate = Core.shiftDateKey(state.selectedDate, 1);
      render();
    });
    els.todayBtn.addEventListener('click', () => {
      state.selectedDate = Core.formatDateKey(new Date());
      render();
    });
    els.datePicker.addEventListener('change', (e) => {
      if (Core.parseDateKey(e.target.value)) {
        state.selectedDate = e.target.value;
        render();
      }
    });

    // Search & Theme
    els.searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      render();
    });
    els.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    // View tabs
    els.viewListBtn.addEventListener('click', () => setView('list'));
    els.viewTimelineBtn.addEventListener('click', () => setView('timeline'));

    // Quick Add form
    els.quickAddForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const scopeVal = (els.quickScopeInput ? els.quickScopeInput.value : state.activeScope) || 'work';
      const ok = handleAddTask(
        {
          title: els.quickTitle.value,
          date: state.selectedDate,
          startTime: els.quickStart.value,
          endTime: els.quickEnd.value,
          category: els.quickCategory.value,
          priority: els.quickPriority.value,
          notes: els.quickNotes.value,
          scope: scopeVal
        },
        els.quickError
      );
      if (ok) {
        els.quickTitle.value = '';
        els.quickStart.value = '';
        els.quickEnd.value = '';
        els.quickNotes.value = '';
        els.quickTitle.focus();
      }
    });

    // Operational task templates (opens interactive questionnaire modal)
    document.querySelectorAll('.template-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const templateKey = btn.dataset.template;
        openTemplatePromptModal(templateKey);
      });
    });

    // Duration presets (shared handler for quick & modal)
    document.querySelectorAll('.preset-pills .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const container = btn.closest('.preset-pills');
        const target = container ? container.dataset.target : 'quick';
        const mins = Number(btn.dataset.duration || 0);
        if (target === 'modal') {
          applyDurationPreset(els.modalStartInput, els.modalEndInput, mins);
        } else {
          applyDurationPreset(els.quickStart, els.quickEnd, mins);
        }
      });
    });

    // Filters
    els.statusButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        els.statusButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.filters.status = btn.dataset.status || 'all';
        render();
      });
    });

    els.filterCategory.addEventListener('change', (e) => {
      state.filters.category = e.target.value;
      render();
    });
    els.filterPriority.addEventListener('change', (e) => {
      state.filters.priority = e.target.value;
      render();
    });
    els.resetFiltersBtn.addEventListener('click', () => {
      state.filters = { status: 'all', category: 'all', priority: 'all', search: '' };
      els.searchInput.value = '';
      els.filterCategory.value = 'all';
      els.filterPriority.value = 'all';
      els.statusButtons.forEach((b) => b.classList.toggle('active', b.dataset.status === 'all'));
      render();
    });

    // Clear completed & Overdue actions
    els.clearCompletedBtn.addEventListener('click', handleClearCompleted);
    els.moveAllOverdueBtn.addEventListener('click', handleMoveAllOverdueToDate);
    els.openAddModalBtn.addEventListener('click', () => openAddModal());
    els.emptyAddBtn.addEventListener('click', () => openAddModal());

    function loadSampleDay() {
      const samples = Core.createSampleTasks(state.selectedDate);
      // Remove any existing duplicate IDs before appending
      const existingIds = new Set(state.tasks.map((t) => t.id));
      const newItems = samples.filter((s) => !existingIds.has(s.id));
      state.tasks = [...state.tasks, ...newItems];
      saveTasks();
      render();
      syncBulkToServer(state.tasks);
      showToast(`Loaded ${newItems.length || samples.length} store tasks for ${state.selectedDate}`);
    }
    els.loadSampleBtn.addEventListener('click', loadSampleDay);
    els.emptySampleBtn.addEventListener('click', loadSampleDay);

    // Excel (.xlsx) Export & JSON Backup / Import
    if (els.topbarExportBtn) {
      els.topbarExportBtn.addEventListener('click', openExportModal);
    }
    if (els.toolbarExportBtn) {
      els.toolbarExportBtn.addEventListener('click', openExportModal);
    }
    if (els.exportBtn) {
      els.exportBtn.addEventListener('click', openExportModal);
    }
    if (els.exportJsonBtn) {
      els.exportJsonBtn.addEventListener('click', () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
        const dl = document.createElement('a');
        dl.setAttribute('href', dataStr);
        dl.setAttribute('download', `dayflow-backup-${state.selectedDate}.json`);
        dl.click();
        showToast('Downloaded JSON backup file');
      });
    }

    els.closeExportModalBtn.addEventListener('click', closeExportModal);
    els.cancelExportBtn.addEventListener('click', closeExportModal);
    els.exportModal.addEventListener('click', (e) => {
      if (e.target === els.exportModal) closeExportModal();
    });

    els.exportScopeAllBtn.addEventListener('click', () => applyExportPreset('all'));
    els.exportScopeRangeBtn.addEventListener('click', () => setExportScope('range'));

    els.exportPresetPills.querySelectorAll('.pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyExportPreset(btn.dataset.preset);
      });
    });

    ['change', 'input'].forEach((evt) => {
      els.exportStartDate.addEventListener(evt, updateExportPreview);
      els.exportEndDate.addEventListener(evt, updateExportPreview);
      els.exportStatusFilter.addEventListener(evt, updateExportPreview);
      els.exportCategoryFilter.addEventListener(evt, updateExportPreview);
    });

    els.exportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeExcelExport();
    });

    els.importBtn.addEventListener('click', () => els.importFileInput.click());
    els.importFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '[]'));
          if (!Array.isArray(parsed)) throw new Error('Invalid format');
          let next = state.tasks.slice();
          const existingIds = new Set(next.map((t) => t.id));
          let importedCount = 0;
          for (const item of parsed) {
            const candidate = item && typeof item === 'object' ? { ...item } : item;
            if (candidate && existingIds.has(candidate.id)) {
              delete candidate.id;
            }
            const res = Core.addTask(next, candidate);
            if (res.ok) {
              next = res.tasks;
              existingIds.add(res.task.id);
              importedCount += 1;
            }
          }
          state.tasks = next;
          saveTasks();
          render();
          syncBulkToServer(state.tasks);
          showToast(`Imported ${importedCount} task${importedCount === 1 ? '' : 's'}`);
        } catch {
          showToast('Invalid JSON file. Could not import tasks.');
        } finally {
          els.importFileInput.value = '';
        }
      };
      reader.readAsText(file);
    });

    // Excel (.xlsx / .xls / .csv) Spreadsheet Import
    function triggerXlsxImport() {
      if (currentUser && currentUser.role === 'viewer') {
        showToast('Viewer Mode: Importing tasks is disabled.');
        return;
      }
      if (els.importXlsxFileInput) {
        els.importXlsxFileInput.click();
      }
    }

    if (els.topbarImportXlsxBtn) {
      els.topbarImportXlsxBtn.addEventListener('click', triggerXlsxImport);
    }
    if (els.toolbarImportXlsxBtn) {
      els.toolbarImportXlsxBtn.addEventListener('click', triggerXlsxImport);
    }
    if (els.importXlsxBtn) {
      els.importXlsxBtn.addEventListener('click', triggerXlsxImport);
    }

    if (els.importXlsxFileInput) {
      els.importXlsxFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (typeof XLSX === 'undefined') {
          showToast('Excel library is still loading. Please try again in a moment.');
          return;
        }

        try {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array' });
          const sheetName = wb.SheetNames[0];
          if (!sheetName) throw new Error('No sheet found in workbook');
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
          if (!rows || rows.length === 0) {
            showToast('No task rows found in spreadsheet.');
            return;
          }

          const res = Core.parseSpreadsheetRows(rows, state.tasks, state.selectedDate);
          state.tasks = res.tasks;
          saveTasks();
          render();
          syncBulkToServer(state.tasks);
          showToast(`Successfully imported ${res.importedCount} task${res.importedCount === 1 ? '' : 's'} from Excel (.xlsx)`);
        } catch (err) {
          console.error('XLSX Import Error:', err);
          showToast('Could not parse Excel spreadsheet. Please ensure valid .xlsx format.');
        } finally {
          els.importXlsxFileInput.value = '';
        }
      });
    }

    // Modal interactions
    els.closeModalBtn.addEventListener('click', closeModal);
    els.modalCancelBtn.addEventListener('click', closeModal);
    els.taskModal.addEventListener('click', (e) => {
      if (e.target === els.taskModal) closeModal();
    });

    els.modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = els.modalTaskId.value;
      const scopeVal = (els.modalScopeInput ? els.modalScopeInput.value : state.activeScope) || 'work';
      const payload = {
        title: els.modalTitleInput.value,
        date: els.modalDateInput.value,
        startTime: els.modalStartInput.value,
        endTime: els.modalEndInput.value,
        category: els.modalCategoryInput.value,
        priority: els.modalPriorityInput.value,
        notes: els.modalNotesInput.value,
        completed: els.modalCompletedInput.checked,
        scope: scopeVal
      };

      const ok = id
        ? handleEditTask(id, payload, els.modalError)
        : handleAddTask(payload, els.modalError);

      if (ok) closeModal();
    });

    els.modalDeleteBtn.addEventListener('click', () => {
      const id = els.modalTaskId.value;
      if (!id) return;
      closeModal();
      handleDeleteTask(id);
    });

    els.modalSnoozeBtn.addEventListener('click', () => {
      const id = els.modalTaskId.value;
      if (!id) return;
      closeModal();
      handleSnoozeTask(id, 2);
    });

    // Template Prompt Modal handling
    els.closeTemplateModalBtn.addEventListener('click', closeTemplateModal);
    els.cancelTemplateBtn.addEventListener('click', closeTemplateModal);
    els.templateModal.addEventListener('click', (e) => {
      if (e.target === els.templateModal) closeTemplateModal();
    });

    els.templateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeTemplateKey) return;
      const config = Core.TEMPLATE_CONFIGS && Core.TEMPLATE_CONFIGS[activeTemplateKey];
      if (!config) return;

      const data = {};
      let firstMissing = null;

      config.fields.forEach((field) => {
        const el = els.templateFieldsContainer.querySelector(`[data-key="${field.key}"]`);
        const val = el ? el.value.trim() : '';
        if (field.required && !val && !firstMissing) {
          firstMissing = el;
        }
        data[field.key] = val;
      });

      if (firstMissing) {
        els.templateError.textContent = 'Please fill in all required fields marked with *.';
        els.templateError.hidden = false;
        firstMissing.focus();
        return;
      }

      els.templateError.hidden = true;
      const payload = config.build(data, state.selectedDate);
      payload.scope = 'work';
      const ok = handleAddTask(payload, els.templateError);
      if (ok) {
        closeTemplateModal();
        if (!els.taskModal.hidden) closeModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!els.exportModal.hidden) {
          closeExportModal();
          return;
        }
        if (!els.templateModal.hidden) {
          closeTemplateModal();
          return;
        }
        if (!els.taskModal.hidden) {
          closeModal();
          return;
        }
      }
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);
      if (isTyping) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openAddModal();
      } else if (e.key === '/') {
        e.preventDefault();
        els.searchInput.focus();
      }
    });

    // RBAC Authentication & Session
    els.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = els.loginUsername.value.trim();
      const p = els.loginPassword.value;
      const res = Core.authenticateUser(u, p);
      if (!res.ok) {
        els.loginError.textContent = res.error || 'Invalid credentials.';
        els.loginError.hidden = false;
        return;
      }
      els.loginError.hidden = true;
      currentUser = res.user;
      saveAuthUser(currentUser);
      applyAuthSession();
      showToast(`Signed in as ${currentUser.displayName} (${currentUser.username})`);
    });

    els.logoutBtn.addEventListener('click', () => {
      currentUser = null;
      saveAuthUser(null);
      applyAuthSession();
      showToast('Signed out successfully.');
    });

    let passwordShown = false;
    els.togglePasswordBtn.addEventListener('click', () => {
      passwordShown = !passwordShown;
      els.loginPassword.type = passwordShown ? 'text' : 'password';
      els.togglePasswordBtn.textContent = passwordShown ? '🔒' : '👁️';
    });

    // Viewer Mode Enforcement: Right-click disabled
    window.addEventListener('contextmenu', (e) => {
      if (currentUser && currentUser.role === 'viewer') {
        e.preventDefault();
        e.stopPropagation();
        showToast('Viewer Mode: Right-click & Inspect Element are disabled.');
        return false;
      }
    }, true);

    // Viewer Mode Enforcement: DevTools / Inspect Element shortcuts disabled
    window.addEventListener('keydown', (e) => {
      if (currentUser && currentUser.role === 'viewer') {
        const isInspect =
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
          (e.metaKey && e.altKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
          (e.ctrlKey && (e.key === 'u' || e.key === 'U'));
        if (isInspect) {
          e.preventDefault();
          e.stopPropagation();
          showToast('Viewer Mode: Inspect element is disabled.');
          return false;
        }
      }
    }, true);

    // Viewer Mode Enforcement: All left clicks blocked except the Logout button
    document.addEventListener('click', (e) => {
      if (currentUser && currentUser.role === 'viewer') {
        if (e.target.closest('#logoutBtn')) {
          return; // Allow logout
        }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showToast('Viewer Mode: Actions and editing are disabled. Only Log Out is available.');
        return false;
      }
    }, true);

    ['mousedown', 'pointerdown'].forEach((evt) => {
      document.addEventListener(evt, (e) => {
        if (currentUser && currentUser.role === 'viewer') {
          if (e.target.closest('#logoutBtn')) return;
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    });

    // Refresh timeline "now" indicator every minute
    setInterval(() => {
      if (state.view === 'timeline' && state.selectedDate === Core.formatDateKey(new Date())) {
        renderTimelineView(
          Core.filterAndSortTasks(state.tasks, { date: state.selectedDate, ...state.filters })
        );
      }
    }, 60000);
    // Cloud sync with codebase storage & Vercel
    syncTasksFromServer();
    // Poll every 4 seconds to sync admin changes with viewer in real-time
    setInterval(syncTasksFromServer, 4000);
    window.addEventListener('focus', syncTasksFromServer);
    // Instant cross-tab sync between admin and viewer
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            state.tasks = parsed;
            render();
          }
        } catch {}
      }
    });
  }

  initTheme();
  applyAuthSession();
  wireEvents();
  render();
})();
