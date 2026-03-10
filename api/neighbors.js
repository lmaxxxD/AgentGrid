const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const cellId = parseInt(req.query.cellId);
  if (!cellId) return res.status(400).json({ error: 'Missing cellId' });

  try {
    await initDB();

    const cell = await sql`SELECT row, col, width, height FROM cells WHERE id = ${cellId}`;
    if (cell.length === 0) return res.status(404).json({ error: 'Cell not found' });

    const c = cell[0];
    const pad = 5;
    const minR = c.row - pad, maxR = c.row + c.height + pad;
    const minC = c.col - pad, maxC = c.col + c.width + pad;

    const neighbors = await sql`
      SELECT id, row, col, width, height, name, emoji, color, category
      FROM cells
      WHERE id != ${cellId}
        AND NOT (row + height <= ${minR} OR row >= ${maxR} OR col + width <= ${minC} OR col >= ${maxC})
      ORDER BY ABS(row - ${c.row}) + ABS(col - ${c.col}) ASC
      LIMIT 8
    `;

    res.json({ neighbors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
