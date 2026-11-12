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
      id: "task_ship_11",
      title: "Shipping ticket 1Z03G13B0339691067 made for Springdale Store",
      date: "2026-11-11",
      startTime: "",
      endTime: "",
      category: "shipping",
      priority: "medium",
      notes: "Store: Springdale Store\nTicket #: 1Z03G13B0339691067\nItems: AC unit, hardware supplies\nStatus: Shipping label created",
      completed: false,
      createdAt: "2026-11-11T10:00:00.000Z",
      updatedAt: "2026-11-11T10:00:00.000Z"
    },
    {
      id: "task_phone_12",
      title: "Phone lines at Quincy are up at 8:36 pm",
      date: "2026-11-12",
      startTime: "20:30",
      endTime: "20:45",
      category: "telecom",
      priority: "medium",
      notes: "Store: Quincy\nStatus: Inbound and outbound calls verified operational\nTime verified: 8:36 pm",
      completed: true,
      createdAt: "2026-11-12T20:30:00.000Z",
      updatedAt: "2026-11-12T20:45:00.000Z"
    },
    {
      id: "task_poc_12",
      title: "Contacted POC at Morrilton, no response — will check back in 15 mins",
      date: "2026-11-12",
      startTime: "21:00",
      endTime: "21:15",
      category: "support",
      priority: "high",
      notes: "Store: Morrilton\nPOC: Aurora\nStatus: Messaged on whatsapp. Missed Campaign. Scheduled follow-up in 1 hours.",
      completed: false,
      createdAt: "2026-11-12T21:00:00.000Z",
      updatedAt: "2026-11-12T21:00:00.000Z"
    },
    {
      id: "task_ata_12",
      title: "ATA Device issue at Store #104 — Sent in group chat for tech review",
      date: "2026-11-12",
      startTime: "11:30",
      endTime: "12:00",
      category: "hardware",
      priority: "high",
      notes: "Store: Store #104\nHardware: ATA (Analog Telephone Adapter)\nSymptoms: Offline / No dial tone\nAction: Sent in group chat for tech review",
      completed: false,
      createdAt: "2026-11-12T11:30:00.000Z",
      updatedAt: "2026-11-12T11:30:00.000Z"
    },
    {
      id: "task_supplies_12",
      title: "Mailed supplies for Springdale Store for AC issue",
      date: "2026-11-12",
      startTime: "14:00",
      endTime: "14:30",
      category: "supplies",
      priority: "medium",
      notes: "Store: Springdale Store\nIssue: AC unit power supply\nSupplies: Replacement adapter and patch cables\nStatus: Packed and mailed",
      completed: false,
      createdAt: "2026-11-12T14:00:00.000Z",
      updatedAt: "2026-11-12T14:00:00.000Z"
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
