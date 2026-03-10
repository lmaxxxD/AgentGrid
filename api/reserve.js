const { sql, initDB } = require('./_db');
const { cellPrice, ROWS, COLS } = require('./_pricing');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { row, col, width, height } = req.body;
  const r = parseInt(row), c = parseInt(col);
  const w = Math.min(20, Math.max(1, parseInt(width) || 1));
  const h = Math.min(20, Math.max(1, parseInt(height) || 1));

  if (r < 0 || r + h > ROWS || c < 0 || c + w > COLS)
    return res.status(400).json({ error: 'Out of bounds' });

  try {
    await initDB();

    // Check conflict with owned cells
    const taken = await sql`
      SELECT id FROM cells
      WHERE NOT (row + height <= ${r} OR row >= ${r + h} OR col + width <= ${c} OR col >= ${c + w})
      LIMIT 1
    `;
    if (taken.length > 0)
      return res.status(400).json({ error: 'One or more cells are already taken' });

    // Check conflict with active reservations
    const reserved = await sql`
      SELECT id FROM reservations
      WHERE expires_at > NOW()
      AND NOT (row + height <= ${r} OR row >= ${r + h} OR col + width <= ${c} OR col >= ${c + w})
      LIMIT 1
    `;
    if (reserved.length > 0)
      return res.status(400).json({ error: 'One or more cells are reserved by another buyer. Please wait or choose different cells.' });

    // Calculate price
    const soldResult = await sql`SELECT COUNT(*)::int AS n FROM cells`;
    const sold = soldResult[0].n;
    let price = 0;
    for (let rr = r; rr < r + h; rr++)
      for (let cc = c; cc < c + w; cc++)
        price += cellPrice(rr, cc, sold);

    // Create reservation (15 min)
    const id = 'rsv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await sql`
      INSERT INTO reservations (id, row, col, width, height, price, expires_at)
      VALUES (${id}, ${r}, ${c}, ${w}, ${h}, ${price}, NOW() + INTERVAL '15 minutes')
    `;

    res.json({ ok: true, reservationId: id, price, expiresIn: 900 });
  } catch (err) {
    console.error('RESERVE ERROR:', err.message || err);
    res.status(500).json({ error: `Server error: ${err.message || 'unknown'}` });
  }
};
