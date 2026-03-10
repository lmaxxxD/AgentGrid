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

      const cell = await sql`SELECT salute_count FROM cells WHERE id = ${cellId}`;
      if (cell.length === 0) return res.status(404).json({ error: 'Cell not found' });

      const already = await sql`SELECT id FROM salutes WHERE cell_id = ${cellId} AND visitor_ip = ${ip}`;

      return res.json({ count: cell[0].salute_count, saluted: already.length > 0 });
    }

    if (req.method === 'POST') {
      const { cellId } = req.body;
      if (!cellId) return res.status(400).json({ error: 'Missing cellId' });

      const cell = await sql`SELECT id, salute_count FROM cells WHERE id = ${parseInt(cellId)}`;
      if (cell.length === 0) return res.status(404).json({ error: 'Cell not found' });

      const already = await sql`SELECT id FROM salutes WHERE cell_id = ${cell[0].id} AND visitor_ip = ${ip}`;
      if (already.length > 0) {
        return res.json({ ok: true, count: cell[0].salute_count, already: true });
      }

      await sql`INSERT INTO salutes (cell_id, visitor_ip) VALUES (${cell[0].id}, ${ip})`;
      await sql`UPDATE cells SET salute_count = salute_count + 1 WHERE id = ${cell[0].id}`;

      return res.json({ ok: true, count: cell[0].salute_count + 1 });
    }

    return res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
