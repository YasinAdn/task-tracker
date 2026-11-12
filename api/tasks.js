const fs = require('fs');
const path = require('path');

// Require statically so Vercel NFT (Node File Trace) bundles data/tasks.json
let defaultSeedTasks = [];
try {
  defaultSeedTasks = require('../data/tasks.json');
} catch (e1) {
  try {
    defaultSeedTasks = require('./data/tasks.json');
  } catch (e2) {
    try {
      const p = path.join(process.cwd(), 'data', 'tasks.json');
      if (fs.existsSync(p)) {
        defaultSeedTasks = JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (e3) {
      defaultSeedTasks = [];
    }
  }
}

// Fallback sample tasks if tasks.json was missing
if (!Array.isArray(defaultSeedTasks) || defaultSeedTasks.length === 0) {
  defaultSeedTasks = [
    {
      id: "task_1",
      date: "2026-11-11",
      startTime: "",
      endTime: "",
      title: "Shipping ticket 1Z03G13B0339691067 made for Springdale Store",
      category: "shipping",
      priority: "medium",
      completed: false,
      notes: "Status: Shipping label created",
      scope: "work",
      createdAt: "2026-11-12T17:37:47.640Z",
      updatedAt: "2026-11-12T17:37:47.640Z"
    },
    {
      id: "task_2",
      date: "2026-11-12",
      startTime: "",
      endTime: "",
      title: "Shipping ticket N/A made for Melrose (items: ATA)",
      category: "shipping",
      priority: "medium",
      completed: false,
      notes: "Ticket #: N/A\nStore: Melrose\nItems: ATA\nStatus: Message sent in group",
      scope: "work",
      createdAt: "2026-11-12T17:37:47.640Z",
      updatedAt: "2026-11-12T17:37:47.640Z"
    },
    {
      id: "task_3",
      date: "2026-11-12",
      startTime: "",
      endTime: "",
      title: "Printer and scanner Issue Freedom Dr",
      category: "support",
      priority: "medium",
      completed: true,
      notes: "Printer and Scanner not working. Sent to supplies",
      scope: "work",
      createdAt: "2026-11-12T17:37:47.640Z",
      updatedAt: "2026-11-12T17:37:47.640Z"
    },
    {
      id: "task_4",
      date: "2026-11-12",
      startTime: "",
      endTime: "",
      title: "Mailed supplies for Huntington for Printer Roller Issue",
      category: "supplies",
      priority: "medium",
      completed: false,
      notes: "Store: Huntington\nIssue: Printer Roller Issue\nSupplies: Mailed to Supplies\nStatus: Mailed",
      scope: "work",
      createdAt: "2026-11-12T17:37:47.640Z",
      updatedAt: "2026-11-12T17:37:47.640Z"
    },
    {
      id: "task_5",
      date: "2026-11-12",
      startTime: "20:30",
      endTime: "20:45",
      title: "Phone lines at Quincy are up at 8:36 pm",
      category: "telecom",
      priority: "medium",
      completed: true,
      notes: "Store: Quincy\nStatus: Inbound and outbound calls verified operational\nTime verified: 8:36 pm",
      scope: "work",
      createdAt: "2026-11-12T17:37:47.641Z",
      updatedAt: "2026-11-12T17:37:47.641Z"
    },
    {
      id: "task_6",
      date: "2026-11-12",
      startTime: "21:00",
      endTime: "21:30",
      title: "Contacted POC at E Griffin, no response — will check back in 30 mins",
      category: "support",
      priority: "high",
      completed: false,
      notes: "Store: E Griffin\nPOC: Leslie\nStatus: Messaged on whatsapp. Other IT Issue. Scheduled follow-up in 1 hours.",
      scope: "work",
      createdAt: "2026-11-12T17:37:47.641Z",
      updatedAt: "2026-11-12T17:37:47.641Z"
    },
    {
      id: "task_7",
      date: "2026-11-12",
      startTime: "21:00",
      endTime: "21:15",
      title: "Contacted POC at Morrilton, no response — will check back in 15 mins",
      category: "support",
      priority: "high",
      completed: false,
      notes: "Store: Morrilton\nPOC: Aurora\nStatus: Messaged on whatsapp. Missed Campaign. Scheduled follow-up in 1 hours.",
      scope: "work",
      createdAt: "2026-11-12T17:37:47.641Z",
      updatedAt: "2026-11-12T17:37:47.641Z"
    },
    {
      id: "task_8",
      date: "2026-11-12",
      startTime: "21:00",
      endTime: "21:15",
      title: "Phone Line verification",
      category: "telecom",
      priority: "medium",
      completed: false,
      notes: "Need to confirm phone calling status at melrose. Contacted POC",
      scope: "work",
      createdAt: "2026-11-12T17:37:47.641Z",
      updatedAt: "2026-11-12T17:37:47.641Z"
    },
    {
      id: "task_9",
      date: "2026-11-12",
      startTime: "21:00",
      endTime: "21:30",
      title: "ATA Device issue at North Versailles — Sent in group along with MAC",
      category: "hardware",
      priority: "high",
      completed: false,
      notes: "Store: North Versailles\nHardware: ATA (Analog Telephone Adapter)\nSymptoms: Keeps malfunctioning\nAction: Sent in group along with MAC",
      scope: "work",
      createdAt: "2026-11-12T17:37:47.641Z",
      updatedAt: "2026-11-12T17:37:47.641Z"
    },
    {
      id: "task_10",
      date: "2026-11-12",
      startTime: "21:30",
      endTime: "22:00",
      title: "Contacted POC at Galveston, gave alt cont. +1 (346) 839‑3331",
      category: "support",
      priority: "high",
      completed: false,
      notes: "Store: Galveston\nPOC: Elvis\nStatus: Messaged on whatsapp. Other IT Issue. Scheduled follow-up in 1 hours.",
      scope: "work",
      createdAt: "2026-11-12T17:37:47.641Z",
      updatedAt: "2026-11-12T17:37:47.641Z"
    }
  ];
}

const Core = require('../scheduler-core.js');

const TMP_FILE = path.join('/tmp', 'tasks_state_v2.json');
const LEGACY_TMP_FILE = path.join('/tmp', 'tasks.json');
const LOCAL_FILE = path.join(process.cwd(), 'data', 'tasks.json');

let memoryState = null;

function normalizeDeletedMap(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k && v) out[k] = String(v);
  }
  return out;
}

function readStateFromCodebase() {
  if (memoryState && Array.isArray(memoryState.tasks)) {
    return memoryState;
  }

  // Try reading { tasks, deleted } from /tmp (persists during serverless lambda lifetime)
  try {
    if (fs.existsSync(TMP_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
      if (parsed && Array.isArray(parsed.tasks)) {
        memoryState = {
          tasks: parsed.tasks,
          deleted: normalizeDeletedMap(parsed.deleted)
        };
        return memoryState;
      }
    }
  } catch (err) {
    // ignore
  }

  // Legacy /tmp/tasks.json fallback
  try {
    if (fs.existsSync(LEGACY_TMP_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LEGACY_TMP_FILE, 'utf8'));
      if (Array.isArray(parsed)) {
        memoryState = { tasks: parsed, deleted: {} };
        return memoryState;
      }
    }
  } catch (err) {
    // ignore
  }

  // Try reading local file in local development
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
      if (Array.isArray(parsed)) {
        memoryState = { tasks: parsed, deleted: {} };
        return memoryState;
      }
    }
  } catch (err) {
    // ignore
  }

  // Fallback to bundled seed tasks
  memoryState = {
    tasks: defaultSeedTasks.slice(),
    deleted: {}
  };
  return memoryState;
}

function writeStateToCodebase(tasks, deleted = {}) {
  const cleanTasks = Array.isArray(tasks) ? tasks : [];
  const cleanDeleted = normalizeDeletedMap(deleted);
  memoryState = { tasks: cleanTasks, deleted: cleanDeleted };

  // Persist full state (tasks + deletion tombstones) in /tmp
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(memoryState, null, 2), 'utf8');
    fs.writeFileSync(LEGACY_TMP_FILE, JSON.stringify(cleanTasks, null, 2), 'utf8');
  } catch (err) {
    // Not applicable on local Windows without /tmp
  }

  // Write tasks array to local codebase file when writable
  try {
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(cleanTasks, null, 2), 'utf8');
  } catch (err) {
    // Serverless filesystem is read-only outside /tmp
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const current = readStateFromCodebase();
      return res.status(200).json({
        ok: true,
        tasks: current.tasks,
        deleted: current.deleted,
        count: current.tasks.length
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const current = readStateFromCodebase();

      if (body && Array.isArray(body.tasks)) {
        const incomingDeleted = normalizeDeletedMap(body.deleted);
        const merged = Core.mergeTaskState(
          current.tasks,
          body.tasks,
          current.deleted,
          incomingDeleted,
          { preferLocalOnTie: false }
        );
        writeStateToCodebase(merged.tasks, merged.deleted);
        return res.status(200).json({
          ok: true,
          tasks: merged.tasks,
          deleted: merged.deleted,
          count: merged.tasks.length
        });
      }

      const task = body;
      if (!task || !task.id || !task.title || !task.date) {
        return res.status(400).json({ ok: false, error: 'Task ID, title, and date are required.' });
      }

      const tasks = current.tasks.slice();
      const deleted = { ...current.deleted };
      const now = new Date().toISOString();
      const incomingUpdated = task.updatedAt || now;
      const normalized = {
        ...task,
        scope: task.scope === 'personal' ? 'personal' : 'work',
        createdAt: task.createdAt || incomingUpdated,
        updatedAt: incomingUpdated
      };

      const existingIndex = tasks.findIndex((t) => t.id === task.id);
      if (existingIndex >= 0) {
        const existingTs = Date.parse(tasks[existingIndex].updatedAt || tasks[existingIndex].createdAt || 0) || 0;
        const incomingTs = Date.parse(normalized.updatedAt) || Date.now();
        if (incomingTs >= existingTs) {
          tasks[existingIndex] = normalized;
        }
      } else {
        tasks.push(normalized);
      }

      // Clear tombstone if task was created/updated after deletion
      if (deleted[task.id]) {
        const delTs = Date.parse(deleted[task.id]) || 0;
        const incomingTs = Date.parse(normalized.updatedAt) || Date.now();
        if (incomingTs > delTs) {
          delete deleted[task.id];
        }
      }

      writeStateToCodebase(tasks, deleted);
      return res.status(200).json({ ok: true, task: normalized });
    }

    if (req.method === 'DELETE') {
      const id = req.query ? req.query.id : null;
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Task ID is required for deletion.' });
      }
      const current = readStateFromCodebase();
      const tasks = current.tasks.filter((t) => t.id !== id);
      const deleted = { ...current.deleted, [id]: new Date().toISOString() };
      writeStateToCodebase(tasks, deleted);
      return res.status(200).json({ ok: true, removedId: id, deletedAt: deleted[id] });
    }

    return res.status(405).json({ ok: false, error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};
