const NEON_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_XER3MYfCj5ez@ep-hidden-sea-bb02ln4w-pooler.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require';
const NEON_SQL_URL = 'https://ep-hidden-sea-bb02ln4w-pooler.c-15.us-east-1.aws.neon.tech/sql';

async function executeSql(query, params = []) {
  let formattedQuery = query;
  if (params && params.length > 0) {
    params.forEach((param, i) => {
      let val;
      if (param === null || param === undefined) {
        val = 'NULL';
      } else if (typeof param === 'number' || typeof param === 'boolean') {
        val = String(param);
      } else {
        val = `'${String(param).replace(/'/g, "''")}'`;
      }
      formattedQuery = formattedQuery.replace(new RegExp(`\\$${i + 1}\\b`, 'g'), val);
    });
  }

  const response = await fetch(NEON_SQL_URL, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': NEON_CONNECTION_STRING,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: formattedQuery })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Neon SQL error: ${errText}`);
  }

  const data = await response.json();
  return data.rows || [];
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
      const rows = await executeSql('SELECT id, title, date, start_time, end_time, category, priority, notes, completed, created_at, updated_at FROM scheduler_tasks ORDER BY date DESC, created_at ASC;');
      const tasks = rows.map((r) => ({
        id: r.id,
        title: r.title,
        date: r.date,
        startTime: r.start_time || '',
        endTime: r.end_time || '',
        category: r.category || 'support',
        priority: r.priority || 'medium',
        notes: r.notes || '',
        completed: Boolean(r.completed),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      return res.status(200).json({ ok: true, tasks });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (body && Array.isArray(body.tasks)) {
        // Bulk replace/sync
        for (const task of body.tasks) {
          if (!task || !task.id || !task.title || !task.date) continue;
          await executeSql(`
            INSERT INTO scheduler_tasks (id, title, date, start_time, end_time, category, priority, notes, completed, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              date = EXCLUDED.date,
              start_time = EXCLUDED.start_time,
              end_time = EXCLUDED.end_time,
              category = EXCLUDED.category,
              priority = EXCLUDED.priority,
              notes = EXCLUDED.notes,
              completed = EXCLUDED.completed,
              updated_at = NOW();
          `, [
            task.id,
            task.title,
            task.date,
            task.startTime || '',
            task.endTime || '',
            task.category || 'support',
            task.priority || 'medium',
            task.notes || '',
            Boolean(task.completed)
          ]);
        }
        return res.status(200).json({ ok: true, syncedCount: body.tasks.length });
      }

      const task = body;
      if (!task || !task.id || !task.title || !task.date) {
        return res.status(400).json({ ok: false, error: 'Task ID, title, and date are required.' });
      }

      await executeSql(`
        INSERT INTO scheduler_tasks (id, title, date, start_time, end_time, category, priority, notes, completed, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          date = EXCLUDED.date,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          category = EXCLUDED.category,
          priority = EXCLUDED.priority,
          notes = EXCLUDED.notes,
          completed = EXCLUDED.completed,
          updated_at = NOW();
      `, [
        task.id,
        task.title,
        task.date,
        task.startTime || '',
        task.endTime || '',
        task.category || 'support',
        task.priority || 'medium',
        task.notes || '',
        Boolean(task.completed)
      ]);

      return res.status(200).json({ ok: true, task });
    }

    if (req.method === 'DELETE') {
      const id = req.query ? req.query.id : null;
      if (!id) {
        return res.status(400).json({ ok: false, error: 'Task ID is required for deletion.' });
      }
      await executeSql('DELETE FROM scheduler_tasks WHERE id = $1;', [id]);
      return res.status(200).json({ ok: true, removedId: id });
    }

    return res.status(405).json({ ok: false, error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};
