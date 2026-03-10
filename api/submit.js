const { sql, initDB }       = require('./_db');
const { verifyTransaction } = require('./_verifyTx');
const { cellPrice, ROWS, COLS } = require('./_pricing');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { txHash, row, col, width, height, name, description, url, emoji, color, category, icon } = req.body;

  if (!txHash || !name)
    return res.status(400).json({ error: 'Missing required fields' });

  const r = parseInt(row), c = parseInt(col);
  const w = Math.min(20, Math.max(1, parseInt(width) || 1));
  const h = Math.min(20, Math.max(1, parseInt(height) || 1));

  if (r < 0 || r + h > ROWS || c < 0 || c + w > COLS)
    return res.status(400).json({ error: 'Out of bounds' });

  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash))
    return res.status(400).json({ error: 'Invalid transaction hash format' });

  try {
    await initDB();

    // Check tx_hash not already used
    const existing = await sql`SELECT id FROM cells WHERE tx_hash = ${txHash}`;
    if (existing.length > 0)
      return res.status(400).json({ error: 'Transaction hash already used' });

    // Check cells still available
    const taken = await sql`
      SELECT id FROM cells
      WHERE NOT (row + height <= ${r} OR row >= ${r + h} OR col + width <= ${c} OR col >= ${c + w})
      LIMIT 1
    `;
    if (taken.length > 0)
      return res.status(400).json({ error: 'One or more selected cells are already taken' });

    // Calculate expected price
    const soldResult = await sql`SELECT COUNT(*)::int AS n FROM cells`;
    const sold = soldResult[0].n;
    let expectedPrice = 0;
    for (let rr = r; rr < r + h; rr++)
      for (let cc = c; cc < c + w; cc++)
        expectedPrice += cellPrice(rr, cc, sold);

    // Verify on-chain payment
    const result = await verifyTransaction(txHash, expectedPrice);
    if (!result.ok)
      return res.status(400).json({ error: result.error });

    // Insert cell
    await sql`
      INSERT INTO cells (row, col, width, height, name, description, url, emoji, color, category, tx_hash, price_paid, icon)
      VALUES (
        ${r}, ${c}, ${w}, ${h},
        ${name.slice(0, 50)},
        ${(description || '').slice(0, 120)},
        ${url || ''},
        ${emoji || '🤖'},
        ${color || '#00ffcc'},
        ${category || 'Other'},
        ${txHash},
        ${result.amountUSD},
        ${(icon || '').slice(0, 20000)}
      )
    `;

    res.json({ ok: true });
  } catch (err) {
    console.error('SUBMIT ERROR:', err.message || err, err.stack || '');
    res.status(500).json({ error: `Server error: ${err.message || 'unknown'}` });
  }
};
