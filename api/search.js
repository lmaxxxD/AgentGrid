const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, limit = 20 } = req.query;
  if (!q || q.trim().length < 2)
    return res.status(400).json({ error: 'Query must be at least 2 characters' });

  const query = q.trim().toLowerCase();

  try {
    await initDB();
    const cells = await sql`
      SELECT id, row, col, width, height, name, description, emoji, color, category, url, price_paid
      FROM cells
      WHERE LOWER(name) LIKE ${'%' + query + '%'}
         OR LOWER(description) LIKE ${'%' + query + '%'}
         OR LOWER(category) LIKE ${'%' + query + '%'}
      ORDER BY price_paid DESC
      LIMIT ${parseInt(limit)}
    `;
    res.json({ cells, count: cells.length });
  } catch (err) {
    console.error('SEARCH ERROR:', err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
};
