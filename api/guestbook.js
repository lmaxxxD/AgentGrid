const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip = (req.headers['x-forwarded-for'] || '127.0.0.1').split(',')[0].trim();

  try {
    await initDB();

    if (req.method === 'GET') {
      const cellId = parseInt(req.query.cellId);
      if (!cellId) return res.status(400).json({ error: 'Missing cellId' });

      const messages = await sql`
        SELECT nickname, message, created_at
        FROM guestbook
        WHERE cell_id = ${cellId}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      return res.json({ messages });
    }

    if (req.method === 'POST') {
      const { cellId, nickname, message } = req.body;
      if (!cellId || !message) return res.status(400).json({ error: 'Missing cellId or message' });

      const msg = message.slice(0, 200).trim();
      const nick = (nickname || 'Anonymous').slice(0, 20).trim() || 'Anonymous';

      if (!msg) return res.status(400).json({ error: 'Message cannot be empty' });

      const cell = await sql`SELECT id FROM cells WHERE id = ${parseInt(cellId)}`;
      if (cell.length === 0) return res.status(404).json({ error: 'Cell not found' });

      // Rate limit: max 5 per IP per cell per hour
      const recent = await sql`
        SELECT COUNT(*)::int AS n FROM guestbook
        WHERE cell_id = ${cell[0].id} AND visitor_ip = ${ip}
          AND created_at > NOW() - INTERVAL '1 hour'
      `;
      if (recent[0].n >= 5) return res.status(429).json({ error: 'Too many messages. Try again later.' });

      const inserted = await sql`
        INSERT INTO guestbook (cell_id, nickname, message, visitor_ip)
        VALUES (${cell[0].id}, ${nick}, ${msg}, ${ip})
        RETURNING nickname, message, created_at
      `;

      return res.json({ ok: true, message: inserted[0] });
    }

    return res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
