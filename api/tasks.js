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
      createdAt: "2026-11-12T17:37:47.641Z",
      updatedAt: "2026-11-12T17:37:47.641Z"
    }
  ];
}

const TMP_FILE = path.join('/tmp', 'tasks.json');
const LOCAL_FILE = path.join(process.cwd(), 'data', 'tasks.json');

let memoryTasks = null;

function readTasksFromCodebase() {
  if (memoryTasks && Array.isArray(memoryTasks) && memoryTasks.length > 0) {
    return memoryTasks;
  }

  // Try reading from /tmp (persists during serverless lambda lifetime)
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryTasks = parsed;
        return memoryTasks;
      }
    }
  } catch (err) {
    // ignore
  }

  // Try reading local file in local development
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const raw = fs.readFileSync(LOCAL_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryTasks = parsed;
        return memoryTasks;
      }
    }
  } catch (err) {
    // ignore
  }

  // Fallback to bundled seed tasks
  memoryTasks = defaultSeedTasks.slice();
  return memoryTasks;
}

function writeTasksToCodebase(tasks) {
  memoryTasks = tasks;
  const jsonStr = JSON.stringify(tasks, null, 2);

  // Write to /tmp in serverless environments
  try {
    fs.writeFileSync(TMP_FILE, jsonStr, 'utf8');
  } catch (err) {
    // Not applicable on local Windows
  }

  // Write to local codebase file if writable
  try {
    fs.writeFileSync(LOCAL_FILE, jsonStr, 'utf8');
  } catch (err) {
    // Serverless filesystem is read-only outside /tmp
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const tasks = readTasksFromCodebase();
      return res.status(200).json({ ok: true, tasks, count: tasks.length });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const tasks = readTasksFromCodebase().slice();

      if (body && Array.isArray(body.tasks)) {
        // Bulk replace/sync
        writeTasksToCodebase(body.tasks);
        return res.status(200).json({ ok: true, count: body.tasks.length });
      }

      const task = body;
      if (!task || !task.id || !task.title || !task.date) {
        return res.status(400).json({ ok: false, error: 'Task ID, title, and date are required.' });
      }

      const existingIndex = tasks.findIndex((t) => t.id === task.id);
      const now = new Date().toISOString();
      const normalized = {
        ...task,
        updatedAt: now
      };
      if (existingIndex >= 0) {
        tasks[existingIndex] = normalized;
      } else {
        if (!normalized.createdAt) normalized.createdAt = now;
        tasks.push(normalized);
      }

      writeTasksToCodebase(tasks);
      return res.status(200).json({ ok: true, task: normalized });
    }

    if (req.method === 'DELETE') {
      const id = req.query ? req.query.id : null;
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Task ID is required for deletion.' });
      }
      let tasks = readTasksFromCodebase().slice();
      tasks = tasks.filter((t) => t.id !== id);
      writeTasksToCodebase(tasks);
      return res.status(200).json({ ok: true, removedId: id });
    }

    return res.status(405).json({ ok: false, error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};
