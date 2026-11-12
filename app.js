(function () {
  'use strict';

  const Core = window.SchedulerCore;
  const STORAGE_KEY = 'daily_task_scheduler_v1';
  const DELETED_KEY = 'daily_task_scheduler_deleted_v1';
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
    deleted: loadDeletedMap(),
    selectedDate: Core.formatDateKey(new Date()),
    activeScope: loadActiveScope(), // 'work' | 'personal'
    view: 'list', // 'list' | 'timeline'
    filters: {
      status: 'all',
      category: 'all',
      priority: 'all',
      search: ''
    },
    compactView: localStorage.getItem('dayflow_compact_view') === 'true',
    sidebarCollapsed: localStorage.getItem('dayflow_sidebar_collapsed') === 'true',
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
    searchClearInlineBtn: document.getElementById('searchClearInlineBtn'),
    searchInstantDropdown: document.getElementById('searchInstantDropdown'),
    searchDropdownCount: document.getElementById('searchDropdownCount'),
    searchDropdownCloseBtn: document.getElementById('searchDropdownCloseBtn'),
    searchDropdownList: document.getElementById('searchDropdownList'),
    searchDropdownViewAllBtn: document.getElementById('searchDropdownViewAllBtn'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    mobileAddFab: document.getElementById('mobileAddFab'),
    topbarExportBtn: document.getElementById('topbarExportBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIconSun: document.getElementById('themeIconSun'),
    themeIconMoon: document.getElementById('themeIconMoon'),

    // Notifications & Audio alerts
    notificationToggleBtn: document.getElementById('notificationToggleBtn'),
    notificationToggleLabel: document.getElementById('notificationToggleLabel'),
    notificationStatusDot: document.getElementById('notificationStatusDot'),
    followupAlertBanner: document.getElementById('followupAlertBanner'),
    followupAlertTitle: document.getElementById('followupAlertTitle'),
    followupAlertScope: document.getElementById('followupAlertScope'),
    followupAlertTime: document.getElementById('followupAlertTime'),
    followupAlertDetails: document.getElementById('followupAlertDetails'),
    followupCompleteBtn: document.getElementById('followupCompleteBtn'),
    followupSnooze15Btn: document.getElementById('followupSnooze15Btn'),
    followupSnooze1hBtn: document.getElementById('followupSnooze1hBtn'),
    followupDismissBtn: document.getElementById('followupDismissBtn'),

    // Scope switcher in header & count badges
    scopeWorkBtn: document.getElementById('scopeWorkBtn'),
    scopePersonalBtn: document.getElementById('scopePersonalBtn'),
    workCountBadge: document.getElementById('workCountBadge'),
    personalCountBadge: document.getElementById('personalCountBadge'),

    // Quick add form & collapsible sidebar
    quickAddCard: document.getElementById('quickAddCard'),
    quickAddBody: document.getElementById('quickAddBody'),
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
    sidebarToggleIcon: document.getElementById('sidebarToggleIcon'),
    quickAddForm: document.getElementById('quickAddForm'),
    quickScopeInput: document.getElementById('quickScope'),
    quickTitle: document.getElementById('quickTitle'),
    quickStart: document.getElementById('quickStart'),
    quickSetNowBtn: document.getElementById('quickSetNowBtn'),
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

    // Main panel toolbar & density
    viewListBtn: document.getElementById('viewListBtn'),
    viewTimelineBtn: document.getElementById('viewTimelineBtn'),
    densityToggleBtn: document.getElementById('densityToggleBtn'),
    densityToggleIcon: document.getElementById('densityToggleIcon'),
    densityToggleLabel: document.getElementById('densityToggleLabel'),
    visibleCountLabel: document.getElementById('visibleCountLabel'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),

    // List view
    listView: document.getElementById('listView'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateText: document.getElementById('emptyStateText'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),
    emptySampleBtn: document.getElementById('emptySampleBtn'),

    // Global Search results section
    searchSection: document.getElementById('searchSection'),
    searchHeadingTitle: document.getElementById('searchHeadingTitle'),
    searchCount: document.getElementById('searchCount'),
    searchSubInfo: document.getElementById('searchSubInfo'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchList: document.getElementById('searchList'),

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
    modalSetNowBtn: document.getElementById('modalSetNowBtn'),
    modalEndInput: document.getElementById('modalEndInput'),
    modalCategoryInput: document.getElementById('modalCategoryInput'),
    modalPriorityInput: document.getElementById('modalPriorityInput'),
    modalFollowupSelect: document.getElementById('modalFollowupSelect'),
    modalNotesInput: document.getElementById('modalNotesInput'),
    modalCompletedWrap: document.getElementById('modalCompletedWrap'),
    modalCompletedInput: document.getElementById('modalCompletedInput'),
    modalError: document.getElementById('modalError'),
    modalDeleteBtn: document.getElementById('modalDeleteBtn'),
    modalSnooze15Btn: document.getElementById('modalSnooze15Btn'),
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

  function requirePermission(action, actionLabel) {
    if (!currentUser) return false;
    if (Core.canUserPerformAction(currentUser.role, action)) {
      return true;
    }
    showToast(`Viewer Mode: ${actionLabel || 'This action'} requires an Admin account.`);
    return false;
  }

  let isSyncing = false;
  let pendingMutationCount = 0;
  let lastLocalMutationAt = 0;

  function markLocalMutation() {
    lastLocalMutationAt = Date.now();
  }

  function hasLocalStoredState() {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  function loadDeletedMap() {
    try {
      const raw = localStorage.getItem(DELETED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {};
  }

  function addDeletedTombstones(ids) {
    const now = new Date().toISOString();
    const next = { ...(state.deleted || {}) };
    (Array.isArray(ids) ? ids : []).forEach((id) => {
      if (id) next[id] = now;
    });
    state.deleted = next;
  }

  function clearDeletedTombstones(ids) {
    const next = { ...(state.deleted || {}) };
    let changed = false;
    (Array.isArray(ids) ? ids : []).forEach((id) => {
      if (id && next[id]) {
        delete next[id];
        changed = true;
      }
    });
    if (changed) state.deleted = next;
  }

  async function syncTasksFromServer(force = false) {
    if (isSyncing) return false;
    // Do not let background polling race right after a user click or while mutations are in flight
    if (!force && (pendingMutationCount > 0 || Date.now() - lastLocalMutationAt < 3500)) {
      return false;
    }
    isSyncing = true;
    try {
      const res = await fetch('/api/tasks', { cache: 'no-store' });
      if (!res.ok) throw new Error('API returned ' + res.status);
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.tasks)) {
        // Re-check mutation guard after awaiting network
        if (pendingMutationCount > 0 || (!force && Date.now() - lastLocalMutationAt < 3500)) {
          return false;
        }
        const isAdmin = Boolean(currentUser && currentUser.role === 'admin');
        const localStored = hasLocalStoredState();
        const serverTasks = data.tasks;
        const serverDeleted = data.deleted && typeof data.deleted === 'object' ? data.deleted : {};

        const merged = Core.mergeTaskState(
          state.tasks,
          serverTasks,
          state.deleted,
          serverDeleted,
          { preferLocalOnTie: isAdmin && localStored }
        );

        const deletedChanged = JSON.stringify(merged.deleted) !== JSON.stringify(state.deleted || {});
        const tasksChanged = JSON.stringify(merged.tasks) !== JSON.stringify(state.tasks || []);

        if (tasksChanged || deletedChanged || !localStored) {
          state.tasks = merged.tasks;
          state.deleted = merged.deleted;
          saveTasksLocally();
          render();
        }

        // If Admin has newer local completions/deletions/edits than server (e.g. Vercel cold-started),
        // push merged truth back up instead of losing changes.
        if (isAdmin && merged.needsServerPush) {
          syncBulkToServer(state.tasks, state.deleted);
        } else if (!localStored && merged.tasks.length === 0 && Object.keys(merged.deleted).length === 0) {
          state.tasks = Core.createSampleTasks(state.selectedDate);
          saveTasksLocally();
          render();
          if (isAdmin) syncBulkToServer(state.tasks, state.deleted);
        }
        return tasksChanged;
      }
    } catch {
      // Offline or static fallback: seed sample tasks only if user has never stored local state
      if (!hasLocalStoredState() && (!state.tasks || state.tasks.length === 0)) {
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
    pendingMutationCount += 1;
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
    } catch {
      // Offline fallback
    } finally {
      pendingMutationCount = Math.max(0, pendingMutationCount - 1);
    }
  }

  async function syncBulkToServer(tasks, deleted = state.deleted) {
    pendingMutationCount += 1;
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks || [],
          deleted: deleted || {}
        })
      });
    } catch {
      // Offline fallback
    } finally {
      pendingMutationCount = Math.max(0, pendingMutationCount - 1);
    }
  }

  async function deleteTaskFromServer(id) {
    if (!id) return;
    pendingMutationCount += 1;
    try {
      await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch {
      // Offline fallback
    } finally {
      pendingMutationCount = Math.max(0, pendingMutationCount - 1);
    }
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    // Wait for /api/tasks on fresh browser rather than overwriting server state with random local samples
    return [];
  }

  function saveTasksLocally() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks || []));
      localStorage.setItem(DELETED_KEY, JSON.stringify(state.deleted || {}));
    } catch {
      // ignore
    }
  }

  function saveTasks() {
    markLocalMutation();
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

    const dev = Core.getCurrentDeviceTime();
    let startMins = Core.timeToMinutes(startInput.value);
    if (startMins === null) {
      startMins = dev.hours * 60 + dev.minutes;
      startInput.value = dev.time;
    }

    const endMins = Math.min(23 * 60 + 59, startMins + durationMinutes);
    endInput.value = Core.minutesToTime(endMins);
  }

  function setFormTimeToNow(startInput, endInput, defaultDurationMinutes = 30) {
    const dev = Core.getCurrentDeviceTime();
    if (startInput) startInput.value = dev.time;
    if (endInput) {
      const endMins = Math.min(23 * 60 + 59, dev.hours * 60 + dev.minutes + defaultDurationMinutes);
      endInput.value = Core.minutesToTime(endMins);
    }
  }

  /* -------------------- Global Search & Density Helpers -------------------- */

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightSearchMatches(text, query) {
    const raw = escapeHtml(text);
    if (!query) return raw;
    const tokens = String(query).trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return raw;
    const pattern = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return raw.replace(pattern, '<mark class="search-highlight">$1</mark>');
  }

  function extractSearchSnippet(notes, query) {
    if (!notes) return '';
    const clean = String(notes).replace(/\n/g, ' • ');
    if (!query) return clean.length > 90 ? clean.slice(0, 90) + '…' : clean;
    const lower = clean.toLowerCase();
    const token = String(query).trim().split(/\s+/)[0]?.toLowerCase();
    if (!token) return clean.length > 90 ? clean.slice(0, 90) + '…' : clean;
    const idx = lower.indexOf(token);
    if (idx === -1) return clean.length > 90 ? clean.slice(0, 90) + '…' : clean;
    const start = Math.max(0, idx - 20);
    const end = Math.min(clean.length, idx + token.length + 50);
    return (start > 0 ? '…' : '') + clean.slice(start, end) + (end < clean.length ? '…' : '');
  }

  function renderInstantSearchDropdown(query) {
    if (!els.searchInstantDropdown) return;
    const q = String(query || '').trim();
    if (!q) {
      els.searchInstantDropdown.hidden = true;
      if (els.searchClearInlineBtn) els.searchClearInlineBtn.hidden = true;
      return;
    }

    if (els.searchClearInlineBtn) els.searchClearInlineBtn.hidden = false;

    // Search across ALL tasks and ALL dates!
    const matches = Core.searchTasksGlobally(state.tasks, q, { limit: 25 });
    if (els.searchDropdownCount) {
      els.searchDropdownCount.textContent = String(matches.length);
    }

    if (matches.length === 0) {
      els.searchDropdownList.innerHTML = `
        <div class="search-dropdown-empty">
          <p>No tasks match <strong>"${escapeHtml(q)}"</strong> across any date.</p>
          <span class="search-empty-sub">Search store #, ticket #, ATA, supplies, or note text.</span>
        </div>
      `;
      els.searchInstantDropdown.hidden = false;
      return;
    }

    els.searchDropdownList.replaceChildren(
      ...matches.map((task) => {
        const item = document.createElement('div');
        item.className = 'search-dropdown-item' + (task.completed ? ' is-completed' : '');
        item.dataset.taskId = task.id;
        item.tabIndex = 0;

        const prio = Core.PRIORITIES[task.priority] || Core.PRIORITIES.medium;
        const isWork = task.scope !== 'personal';
        const highlightedTitle = highlightSearchMatches(task.title, q);
        const snippet = extractSearchSnippet(task.notes, q);

        item.innerHTML = `
          <div class="search-item-top">
            <span class="search-item-scope ${isWork ? 'scope-work' : 'scope-personal'}">${isWork ? '💼 WORK' : '👤 PERSONAL'}</span>
            <span class="search-item-date">📅 ${escapeHtml(formatShortDate(task.date))}</span>
            ${task.startTime ? `<span class="search-item-time">⏰ ${escapeHtml(Core.formatTime12h(task.startTime))}</span>` : '<span class="search-item-time">Flexible</span>'}
            <span class="search-item-prio prio-${task.priority}">${prio.label}</span>
          </div>
          <div class="search-item-title">${highlightedTitle}</div>
          ${snippet ? `<div class="search-item-notes">${highlightSearchMatches(snippet, q)}</div>` : ''}
        `;

        item.addEventListener('click', () => {
          openEditModal(task.id);
          els.searchInstantDropdown.hidden = true;
        });

        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            openEditModal(task.id);
            els.searchInstantDropdown.hidden = true;
          }
        });

        return item;
      })
    );

    els.searchInstantDropdown.hidden = false;
  }

  function applyCompactView(isCompact) {
    document.body.classList.toggle('compact-density', Boolean(isCompact));
    if (els.densityToggleBtn) {
      els.densityToggleBtn.setAttribute('aria-pressed', String(Boolean(isCompact)));
    }
    if (els.densityToggleLabel) {
      els.densityToggleLabel.textContent = isCompact ? 'Comfortable' : 'Compact';
    }
    if (els.densityToggleIcon) {
      els.densityToggleIcon.textContent = isCompact ? '▤' : '≡';
    }
    render();
  }

  function applySidebarCollapsed(isCollapsed) {
    if (!els.quickAddBody || !els.sidebarToggleBtn) return;
    els.quickAddBody.classList.toggle('is-collapsed', Boolean(isCollapsed));
    els.sidebarToggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
    if (els.sidebarToggleIcon) {
      els.sidebarToggleIcon.textContent = isCollapsed ? '+' : '−';
    }
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

  /* -------------------- Follow-Up Notification Service -------------------- */

  let activeAlertTaskId = null;

  function playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Note 1: High crisp chime (E6 ~ 1318.5 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.51, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Note 2: Warm resolving tone (A6 ~ 1760 Hz) after 140ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760.00, now + 0.14);
      gain2.gain.setValueAtTime(0, now + 0.14);
      gain2.gain.linearRampToValueAtTime(0.38, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.85);
    } catch {
      // Audio playback unavailable or blocked by browser policy
    }
  }

  function getNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      showToast('Browser notifications are not supported in this browser.');
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      updateNotificationStatusUI();
      if (result === 'granted') {
        playNotificationChime();
        showToast('Follow-up notifications enabled! Audio chime active.');
        try {
          new Notification('Dayflow Follow-up Alerts Active', {
            body: 'You will receive desktop notifications when 15-minute follow-ups are due.',
            icon: '/favicon.ico'
          });
        } catch {}
      } else if (result === 'denied') {
        showToast('Notifications blocked. You will still receive in-app alerts and audio chimes.');
      }
      return result;
    } catch {
      return 'denied';
    }
  }

  function updateNotificationStatusUI() {
    if (!els.notificationStatusDot || !els.notificationToggleLabel) return;
    const perm = getNotificationPermission();
    if (perm === 'granted') {
      els.notificationStatusDot.className = 'notification-status-dot active';
      els.notificationStatusDot.title = 'Alerts enabled (OS notifications & audio active)';
      els.notificationToggleLabel.textContent = 'Alerts On';
    } else if (perm === 'denied') {
      els.notificationStatusDot.className = 'notification-status-dot blocked';
      els.notificationStatusDot.title = 'OS notifications blocked in browser settings. In-app alerts remain active.';
      els.notificationToggleLabel.textContent = 'Alerts (In-App)';
    } else {
      els.notificationStatusDot.className = 'notification-status-dot';
      els.notificationStatusDot.title = 'Click to enable desktop notifications for 15m follow-ups';
      els.notificationToggleLabel.textContent = 'Enable Alerts';
    }
  }

  function triggerFollowupAlert(task) {
    if (!task) return;
    activeAlertTaskId = task.id;

    // Play chime sound
    playNotificationChime();

    // Show native desktop notification
    if (getNotificationPermission() === 'granted') {
      try {
        const notif = new Notification(`⏰ Follow-up Due: ${task.title}`, {
          body: task.notes ? task.notes.replace(/\n/g, ' • ') : 'Your scheduled follow-up time has been reached.',
          icon: '/favicon.ico',
          tag: `task-${task.id}`
        });
        notif.onclick = () => {
          window.focus();
          openEditModal(task.id);
        };
      } catch {}
    }

    // Display In-App Floating Alert Banner
    if (els.followupAlertBanner) {
      els.followupAlertTitle.textContent = task.title;
      els.followupAlertScope.textContent = task.scope === 'personal' ? '👤 Personal' : '💼 Work';
      const detailText = task.notes ? task.notes.split('\n')[0] : 'Follow-up time reached.';
      els.followupAlertDetails.textContent = detailText;
      els.followupAlertTime.textContent = task.endTime ? Core.formatTime12h(task.endTime) : 'Now';
      els.followupAlertBanner.hidden = false;
    }

    // Mark task as notified to avoid repeating every tick
    const nowIso = new Date().toISOString();
    handleEditTask(task.id, { notifiedAt: nowIso }, { hidden: true });
  }

  function dismissFollowupAlert() {
    if (els.followupAlertBanner) {
      els.followupAlertBanner.hidden = true;
    }
    activeAlertTaskId = null;
  }

  function checkFollowupDueReminders() {
    const nowMs = Date.now();

    for (const task of state.tasks) {
      if (task.completed) continue;
      // Skip if task already notified within the last 15 minutes
      if (task.notifiedAt) {
        const lastNotifiedMs = Date.parse(task.notifiedAt);
        if (!Number.isNaN(lastNotifiedMs) && nowMs - lastNotifiedMs < 15 * 60 * 1000) {
          continue;
        }
      }

      const dueMs = Core.getTaskFollowupTime(task);
      if (dueMs !== null && nowMs >= dueMs) {
        // Alert if due within the last 2 hours
        if (nowMs - dueMs < 2 * 60 * 60 * 1000) {
          triggerFollowupAlert(task);
          break;
        }
      }
    }
  }

  /* -------------------- Task Mutations -------------------- */

  function handleAddTask(input, errorEl) {
    if (!requirePermission('add', 'Adding tasks')) return false;
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
    if (!requirePermission('edit', 'Editing tasks')) return false;
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
    if (!requirePermission('delete', 'Deleting tasks')) return;
    const previousTasks = state.tasks.slice();
    const res = Core.removeTask(state.tasks, id);
    if (!res.ok || !res.removed) return;
    state.tasks = res.tasks;
    addDeletedTombstones([id]);
    saveTasks();
    render();
    deleteTaskFromServer(id);

    showToast(`Removed "${res.removed.title}"`, () => {
      const restored = { ...res.removed, updatedAt: new Date().toISOString() };
      state.tasks = previousTasks.map((t) => (t.id === id ? restored : t));
      clearDeletedTombstones([id]);
      saveTasks();
      render();
      pushTaskToServer(restored);
      showToast(`Restored "${res.removed.title}"`);
    });
  }

  function handleSnoozeTask(id, hours) {
    if (!requirePermission('edit', 'Rescheduling tasks')) return;
    const hrs = typeof hours === 'number' ? hours : 2;
    const res = Core.snoozeTask(state.tasks, id, hrs);
    if (!res.ok) return;
    state.tasks = res.tasks;
    saveTasks();
    render();
    pushTaskToServer(res.task);
    const mins = Math.round(hrs * 60);
    const label = mins < 60 ? `+${mins}m` : `+${hrs}h`;
    showToast(`Follow-up scheduled for ${Core.formatTime12h(res.task.startTime)} (${label})`);
  }

  function handleMoveTaskToDate(id, targetDate) {
    if (!requirePermission('edit', 'Moving tasks')) return;
    const res = Core.moveTaskToDate(state.tasks, id, targetDate);
    if (!res.ok) return;
    state.tasks = res.tasks;
    saveTasks();
    render();
    pushTaskToServer(res.task);
    showToast(`Moved "${res.task.title}" to ${formatDisplayDate(targetDate)}`);
  }

  function handleMoveAllOverdueToDate() {
    if (!requirePermission('edit', 'Moving tasks')) return;
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
    if (!requirePermission('edit', 'Completing tasks')) return;
    const res = Core.toggleTaskCompletion(state.tasks, id);
    if (!res.ok) return;
    state.tasks = res.tasks;
    saveTasks();
    render();
    pushTaskToServer(res.task);
  }

  function handleClearCompleted() {
    if (!requirePermission('delete', 'Clearing completed tasks')) return;
    const previousTasks = state.tasks.slice();
    const res = Core.clearCompletedForDate(state.tasks, state.selectedDate, state.activeScope);
    if (res.removedCount === 0) return;
    const keptIds = new Set(res.tasks.map((t) => t.id));
    const removedIds = previousTasks.filter((t) => !keptIds.has(t.id)).map((t) => t.id);
    state.tasks = res.tasks;
    addDeletedTombstones(removedIds);
    saveTasks();
    render();
    syncBulkToServer(state.tasks, state.deleted);

    const scopeLabel = state.activeScope === 'personal' ? 'personal ' : 'work ';
    showToast(`Cleared ${res.removedCount} completed ${scopeLabel}task${res.removedCount === 1 ? '' : 's'}`, () => {
      const now = new Date().toISOString();
      const removedSet = new Set(removedIds);
      state.tasks = previousTasks.map((t) => (removedSet.has(t.id) ? { ...t, updatedAt: now } : t));
      clearDeletedTombstones(removedIds);
      saveTasks();
      render();
      syncBulkToServer(state.tasks, state.deleted);
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

  let xlsxLoadPromise = null;

  function loadXlsxLibrary() {
    if (typeof XLSX !== 'undefined') {
      return Promise.resolve();
    }
    if (xlsxLoadPromise) {
      return xlsxLoadPromise;
    }
    xlsxLoadPromise = new Promise((resolve, reject) => {
      const injectScript = (src, fallbackSrc) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => {
          if (typeof XLSX !== 'undefined') {
            resolve();
          } else if (fallbackSrc) {
            injectScript(fallbackSrc, null);
          } else {
            xlsxLoadPromise = null;
            reject(new Error('XLSX global unavailable after load'));
          }
        };
        s.onerror = () => {
          if (fallbackSrc) {
            injectScript(fallbackSrc, null);
          } else {
            xlsxLoadPromise = null;
            reject(new Error('Failed to load Excel engine'));
          }
        };
        document.head.appendChild(s);
      };
      injectScript(
        'vendor/xlsx.full.min.js',
        'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js'
      );
    });
    return xlsxLoadPromise;
  }

  function openExportModal() {
    if (!requirePermission('export', 'Exporting tasks')) return;
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

  async function executeExcelExport() {
    if (!requirePermission('export', 'Exporting tasks')) return;
    if (els.confirmExportBtn) {
      els.confirmExportBtn.disabled = true;
      els.confirmExportBtn.textContent = 'Preparing .xlsx...';
    }
    try {
      await loadXlsxLibrary();
    } catch {
      showToast('Could not load Excel exporter library. Please check your connection.');
      if (els.confirmExportBtn) {
        els.confirmExportBtn.disabled = false;
        els.confirmExportBtn.textContent = 'Download .xlsx';
      }
      return;
    }
    if (els.confirmExportBtn) {
      els.confirmExportBtn.disabled = false;
      els.confirmExportBtn.textContent = 'Download .xlsx';
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
    if (!requirePermission('add', 'Adding tasks')) return;
    const opts = defaults || {};
    const defaultScope = opts.scope || state.activeScope || 'work';
    setFormScope('modal', defaultScope);

    // Auto-detect current device time across PC, Phone, Mac, etc.
    const dev = Core.getCurrentDeviceTime();
    const startTime = opts.startTime !== undefined ? opts.startTime : dev.time;
    let endTime = opts.endTime || '';
    if (!endTime && startTime) {
      const startMins = Core.timeToMinutes(startTime);
      if (startMins !== null) {
        endTime = Core.minutesToTime(Math.min(23 * 60 + 59, startMins + 30));
      }
    }

    els.modalTaskId.value = '';
    els.modalHeading.textContent = 'Add Task';
    els.modalSubmitBtn.textContent = 'Add Task';
    els.modalTitleInput.value = opts.title || '';
    els.modalDateInput.value = opts.date || state.selectedDate || dev.dateKey;
    els.modalStartInput.value = startTime;
    els.modalEndInput.value = endTime;
    els.modalCategoryInput.value = opts.category || (defaultScope === 'personal' ? 'personal' : 'support');
    els.modalPriorityInput.value = opts.priority || 'medium';
    els.modalNotesInput.value = opts.notes || '';
    els.modalCompletedInput.checked = false;
    els.modalCompletedWrap.hidden = true;
    els.modalDeleteBtn.hidden = true;
    if (els.modalSnooze15Btn) els.modalSnooze15Btn.hidden = true;
    els.modalSnoozeBtn.hidden = true;
    if (els.modalFollowupSelect) els.modalFollowupSelect.value = 'auto';
    els.modalError.hidden = true;

    els.taskModal.hidden = false;
    els.modalTitleInput.focus();
  }

  function openEditModal(taskId) {
    if (!requirePermission('edit', 'Editing tasks')) return;
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
    if (els.modalFollowupSelect) {
      els.modalFollowupSelect.value = task.remindAt ? '15' : 'auto';
    }
    els.modalCompletedInput.checked = Boolean(task.completed);
    els.modalCompletedWrap.hidden = false;
    els.modalDeleteBtn.hidden = false;
    if (els.modalSnooze15Btn) els.modalSnooze15Btn.hidden = false;
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

  function buildTaskCard(task, options = {}) {
    const isSearchMode = Boolean(options.showDate || state.filters.search);
    const cat = Core.CATEGORIES[task.category] || Core.CATEGORIES.support || Core.CATEGORIES.work;
    const prio = Core.PRIORITIES[task.priority] || Core.PRIORITIES.medium;

    const card = document.createElement('article');
    card.className =
      'task-card' +
      (task.completed ? ' is-completed' : '') +
      (state.compactView ? ' compact-card' : '');
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
    if (state.filters.search) {
      titleEl.innerHTML = highlightSearchMatches(task.title, state.filters.search);
    } else {
      titleEl.textContent = task.title;
    }
    top.appendChild(titleEl);

    if (isSearchMode || task.date !== state.selectedDate) {
      const dateTag = document.createElement('button');
      dateTag.type = 'button';
      dateTag.className = 'task-date-badge';
      dateTag.textContent = `📅 ${formatShortDate(task.date)}`;
      dateTag.title = `Jump to schedule for ${formatDisplayDate(task.date)}`;
      dateTag.addEventListener('click', (e) => {
        e.stopPropagation();
        changeDate(task.date);
      });
      top.appendChild(dateTag);
    }

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

    if (task.remindAt && !task.completed) {
      const remindMs = Date.parse(task.remindAt);
      if (!Number.isNaN(remindMs)) {
        const diffMins = Math.round((remindMs - Date.now()) / 60000);
        const alertTag = document.createElement('span');
        alertTag.className = 'followup-indicator-tag';
        alertTag.textContent = diffMins > 0 ? `⏰ In ${diffMins}m` : '⏰ Due Now';
        meta.appendChild(alertTag);
      }
    }

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

    const snooze15Btn = document.createElement('button');
    snooze15Btn.type = 'button';
    snooze15Btn.className = 'snooze-15m-btn';
    snooze15Btn.title = 'Reschedule / Follow up in 15 minutes (+15m reminder)';
    snooze15Btn.textContent = '+15m';
    snooze15Btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSnoozeTask(task.id, 0.25);
    });

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
    const isSearch = Boolean(grouped.isSearchMode || state.filters.search);
    const totalVisible = grouped.all.length;

    if (isSearch) {
      els.emptyState.hidden = totalVisible > 0;
      if (totalVisible === 0) {
        els.emptyStateTitle.textContent = `No tasks match "${state.filters.search}"`;
        els.emptyStateText.textContent =
          'Searched all tasks across all dates, notes, and scopes. Try different keywords.';
        els.emptySampleBtn.hidden = true;
      }

      if (els.overdueSection) els.overdueSection.hidden = true;
      if (els.scheduledSection) els.scheduledSection.hidden = true;
      if (els.anytimeSection) els.anytimeSection.hidden = true;

      if (els.searchSection) {
        els.searchSection.hidden = totalVisible === 0;
        if (els.searchHeadingTitle) {
          els.searchHeadingTitle.textContent = `All-Time Search: "${state.filters.search}"`;
        }
        if (els.searchCount) {
          els.searchCount.textContent = String(totalVisible);
        }
        if (els.searchSubInfo) {
          els.searchSubInfo.textContent = `Found ${totalVisible} matching task${totalVisible === 1 ? '' : 's'} across all dates (Work & Personal)`;
        }
        if (els.searchList) {
          els.searchList.replaceChildren(...grouped.all.map((t) => buildTaskCard(t, { showDate: true })));
        }
      }
      return;
    }

    if (els.searchSection) els.searchSection.hidden = true;

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

      const snooze15Btn = document.createElement('button');
      snooze15Btn.type = 'button';
      snooze15Btn.className = 'mini-btn';
      snooze15Btn.title = 'Reschedule +15m';
      snooze15Btn.textContent = '+15m';
      snooze15Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSnoozeTask(task.id, 0.25);
      });

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
    if (state.filters.search) {
      els.visibleCountLabel.textContent = `${count} result${count === 1 ? '' : 's'} (all dates)`;
    } else {
      const scopeLabel = state.activeScope === 'personal' ? 'Personal' : 'Work';
      els.visibleCountLabel.textContent = `${count} ${scopeLabel} task${count === 1 ? '' : 's'}`;
    }

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

    // Global Search & Zero-Scroll Instant Results
    function handleSearchInput(value) {
      const q = String(value || '').trim();
      state.filters.search = q;
      if (els.searchClearInlineBtn) {
        els.searchClearInlineBtn.hidden = !q;
      }
      render();
      renderInstantSearchDropdown(q);
      if (q && window.innerWidth <= 840) {
        applySidebarCollapsed(true);
      }
    }

    els.searchInput.addEventListener('input', (e) => {
      handleSearchInput(e.target.value);
    });

    els.searchInput.addEventListener('focus', () => {
      if (els.searchInput.value.trim()) {
        renderInstantSearchDropdown(els.searchInput.value.trim());
      }
    });

    els.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        els.searchInput.value = '';
        handleSearchInput('');
        if (els.searchInstantDropdown) els.searchInstantDropdown.hidden = true;
        els.searchInput.blur();
      } else if (e.key === 'ArrowDown') {
        const first = els.searchDropdownList ? els.searchDropdownList.querySelector('.search-dropdown-item') : null;
        if (first) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Enter') {
        if (els.searchInstantDropdown) els.searchInstantDropdown.hidden = true;
        if (els.searchSection && !els.searchSection.hidden) {
          els.searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });

    if (els.searchClearInlineBtn) {
      els.searchClearInlineBtn.addEventListener('click', () => {
        els.searchInput.value = '';
        handleSearchInput('');
        if (els.searchInstantDropdown) els.searchInstantDropdown.hidden = true;
        els.searchInput.focus();
      });
    }

    if (els.clearSearchBtn) {
      els.clearSearchBtn.addEventListener('click', () => {
        els.searchInput.value = '';
        handleSearchInput('');
        if (els.searchInstantDropdown) els.searchInstantDropdown.hidden = true;
      });
    }

    if (els.searchDropdownCloseBtn) {
      els.searchDropdownCloseBtn.addEventListener('click', () => {
        if (els.searchInstantDropdown) els.searchInstantDropdown.hidden = true;
      });
    }

    if (els.searchDropdownViewAllBtn) {
      els.searchDropdownViewAllBtn.addEventListener('click', () => {
        if (els.searchInstantDropdown) els.searchInstantDropdown.hidden = true;
        if (els.searchSection && !els.searchSection.hidden) {
          els.searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // Dismiss search dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (els.searchInstantDropdown && !els.searchInstantDropdown.hidden) {
        const searchWrap = e.target.closest('.search-wrap');
        if (!searchWrap) {
          els.searchInstantDropdown.hidden = true;
        }
      }
    });

    // Sidebar Collapsible & Density toggles
    if (els.sidebarToggleBtn) {
      els.sidebarToggleBtn.addEventListener('click', () => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        localStorage.setItem('dayflow_sidebar_collapsed', String(state.sidebarCollapsed));
        applySidebarCollapsed(state.sidebarCollapsed);
      });
    }

    if (els.densityToggleBtn) {
      els.densityToggleBtn.addEventListener('click', () => {
        state.compactView = !state.compactView;
        localStorage.setItem('dayflow_compact_view', String(state.compactView));
        applyCompactView(state.compactView);
      });
    }

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
        setFormTimeToNow(els.quickStart, els.quickEnd, 30);
        els.quickNotes.value = '';
        els.quickTitle.focus();
      }
    });

    // Auto-detect current device time buttons (Now)
    if (els.quickSetNowBtn) {
      els.quickSetNowBtn.addEventListener('click', () => {
        setFormTimeToNow(els.quickStart, els.quickEnd, 30);
      });
    }

    if (els.modalSetNowBtn) {
      els.modalSetNowBtn.addEventListener('click', () => {
        setFormTimeToNow(els.modalStartInput, els.modalEndInput, 30);
      });
    }

    // Mobile Floating Add Button
    if (els.mobileAddFab) {
      els.mobileAddFab.addEventListener('click', () => openAddModal());
    }

    // Prime quick form with current device time
    setFormTimeToNow(els.quickStart, els.quickEnd, 30);

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
      if (!requirePermission('add', 'Loading sample tasks')) return;
      const samples = Core.createSampleTasks(state.selectedDate);
      // Remove any existing duplicate IDs before appending
      const existingIds = new Set(state.tasks.map((t) => t.id));
      const newItems = samples.filter((s) => !existingIds.has(s.id));
      clearDeletedTombstones(newItems.map((s) => s.id));
      state.tasks = [...state.tasks, ...newItems];
      saveTasks();
      render();
      syncBulkToServer(state.tasks, state.deleted);
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
      if (!requirePermission('add', 'Importing tasks')) return;
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
        if (!requirePermission('add', 'Importing tasks')) {
          els.importXlsxFileInput.value = '';
          return;
        }
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
          await loadXlsxLibrary();
        } catch {
          showToast('Could not load Excel reader library. Please check your connection.');
          els.importXlsxFileInput.value = '';
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

      const followupChoice = els.modalFollowupSelect ? els.modalFollowupSelect.value : 'auto';
      let remindAt = '';
      if (followupChoice === '15') {
        remindAt = new Date(Date.now() + 15 * 60000).toISOString();
      } else if (followupChoice === '30') {
        remindAt = new Date(Date.now() + 30 * 60000).toISOString();
      } else if (followupChoice === '60') {
        remindAt = new Date(Date.now() + 60 * 60000).toISOString();
      } else if (followupChoice === '120') {
        remindAt = new Date(Date.now() + 120 * 60000).toISOString();
      } else if (followupChoice === 'none') {
        remindAt = '';
      } else if (id) {
        const existing = state.tasks.find((t) => t.id === id);
        if (existing && existing.remindAt) remindAt = existing.remindAt;
      }

      const payload = {
        title: els.modalTitleInput.value,
        date: els.modalDateInput.value,
        startTime: els.modalStartInput.value,
        endTime: els.modalEndInput.value,
        category: els.modalCategoryInput.value,
        priority: els.modalPriorityInput.value,
        notes: els.modalNotesInput.value,
        completed: els.modalCompletedInput.checked,
        scope: scopeVal,
        remindAt,
        notifiedAt: ''
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

    if (els.modalSnooze15Btn) {
      els.modalSnooze15Btn.addEventListener('click', () => {
        const id = els.modalTaskId.value;
        if (!id) return;
        closeModal();
        handleSnoozeTask(id, 0.25);
      });
    }

    els.modalSnoozeBtn.addEventListener('click', () => {
      const id = els.modalTaskId.value;
      if (!id) return;
      closeModal();
      handleSnoozeTask(id, 2);
    });

    // Follow-up Notification Toggle & Chime Test
    if (els.notificationToggleBtn) {
      els.notificationToggleBtn.addEventListener('click', async () => {
        const perm = getNotificationPermission();
        if (perm === 'granted') {
          playNotificationChime();
          showToast('Alert test: Notifications and audio chime are operational!');
        } else {
          await requestNotificationPermission();
        }
      });
    }

    // Follow-up Alert Banner Action Buttons
    if (els.followupCompleteBtn) {
      els.followupCompleteBtn.addEventListener('click', () => {
        if (activeAlertTaskId) {
          handleToggleTask(activeAlertTaskId);
          showToast('Follow-up task marked completed');
        }
        dismissFollowupAlert();
      });
    }

    if (els.followupSnooze15Btn) {
      els.followupSnooze15Btn.addEventListener('click', () => {
        if (activeAlertTaskId) {
          handleSnoozeTask(activeAlertTaskId, 0.25);
        }
        dismissFollowupAlert();
      });
    }

    if (els.followupSnooze1hBtn) {
      els.followupSnooze1hBtn.addEventListener('click', () => {
        if (activeAlertTaskId) {
          handleSnoozeTask(activeAlertTaskId, 1);
        }
        dismissFollowupAlert();
      });
    }

    if (els.followupDismissBtn) {
      els.followupDismissBtn.addEventListener('click', dismissFollowupAlert);
    }

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
      render();
      syncTasksFromServer(true);
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

    // Viewer Mode Enforcement: allow read-only browsing while blocking write controls
    function isViewerAllowedInteraction(target) {
      if (!target || typeof target.closest !== 'function') return false;
      if (target.closest('.task-checkbox, .task-actions, .timeline-item-actions, #quickAddCard, #dataToolsCard')) {
        return false;
      }
      if (target.closest('#followupCompleteBtn, #followupSnooze15Btn, #followupSnooze1hBtn, #clearCompletedBtn, #moveAllOverdueBtn, #openAddModalBtn, #emptyAddBtn, #emptySampleBtn, #mobileAddFab')) {
        return false;
      }
      return Boolean(
        target.closest(
          '#logoutBtn, .date-nav, .scope-switcher, .search-wrap, #searchSection, .view-tabs, #densityToggleBtn, #themeToggleBtn, #notificationToggleBtn, #followupDismissBtn, #filterCategory, #filterPriority, .seg-btn[data-status], #resetFiltersBtn, .task-date-badge'
        )
      );
    }

    document.addEventListener('click', (e) => {
      if (currentUser && currentUser.role === 'viewer') {
        if (isViewerAllowedInteraction(e.target)) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showToast('Viewer Mode: Read-only access. Sign in as Admin to make changes.');
        return false;
      }
    }, true);

    ['mousedown', 'pointerdown'].forEach((evt) => {
      document.addEventListener(evt, (e) => {
        if (currentUser && currentUser.role === 'viewer') {
          if (isViewerAllowedInteraction(e.target)) return;
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    });

    // Refresh timeline "now" indicator every minute (only when tab is visible)
    setInterval(() => {
      if (document.hidden) return;
      if (state.view === 'timeline' && state.selectedDate === Core.formatDateKey(new Date())) {
        renderTimelineView(
          Core.filterAndSortTasks(state.tasks, { date: state.selectedDate, ...state.filters })
        );
      }
    }, 60000);
    // Cloud sync with codebase storage & Vercel
    syncTasksFromServer();
    // Poll every 4 seconds when visible to sync admin changes with viewer efficiently
    setInterval(() => {
      if (!document.hidden) syncTasksFromServer();
    }, 4000);
    window.addEventListener('focus', syncTasksFromServer);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        syncTasksFromServer();
        checkFollowupDueReminders();
      }
    });
    // Instant cross-tab sync between admin and viewer
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            state.tasks = parsed;
            state.deleted = loadDeletedMap();
            render();
          }
        } catch {}
      } else if (e.key === DELETED_KEY) {
        state.deleted = loadDeletedMap();
      }
    });
    // Follow-up reminder poller (checks every 4 seconds when tab is visible)
    setInterval(() => {
      if (!document.hidden) checkFollowupDueReminders();
    }, 4000);
    updateNotificationStatusUI();
  }

  initTheme();
  applyAuthSession();
  applyCompactView(state.compactView);
  applySidebarCollapsed(state.sidebarCollapsed);
  wireEvents();
  render();
})();
