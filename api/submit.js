const { sql, initDB }       = require('./_db');
const { verifyTransaction } = require('./_verifyTx');
const { ROWS, COLS } = require('./_pricing');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { txHash, reservationId, name, description, url, emoji, color, category, icon } = req.body;

  if (!txHash || !name || !reservationId)
    return res.status(400).json({ error: 'Missing required fields' });

  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash))
    return res.status(400).json({ error: 'Invalid transaction hash format' });

  try {
    await initDB();

    // Look up reservation
    const rsvRows = await sql`SELECT * FROM reservations WHERE id = ${reservationId} AND expires_at > NOW()`;
    if (rsvRows.length === 0)
      return res.status(400).json({ error: 'Reservation expired or not found. Please select cells again.' });

    const rsv = rsvRows[0];
    const r = rsv.row, c = rsv.col, w = rsv.width, h = rsv.height;
    const expectedPrice = rsv.price;

    // Check tx_hash not already used
    const existing = await sql`SELECT id FROM cells WHERE tx_hash = ${txHash}`;
    if (existing.length > 0)
      return res.status(400).json({ error: 'Transaction hash already used' });

    // Double-check cells still available
    const taken = await sql`
      SELECT id FROM cells
      WHERE NOT (row + height <= ${r} OR row >= ${r + h} OR col + width <= ${c} OR col >= ${c + w})
      LIMIT 1
    `;
    if (taken.length > 0)
      return res.status(400).json({ error: 'One or more selected cells are already taken' });

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

    // Remove reservation
    await sql`DELETE FROM reservations WHERE id = ${reservationId}`;

    res.json({ ok: true });
  } catch (err) {
    console.error('SUBMIT ERROR:', err.message || err, err.stack || '');
    res.status(500).json({ error: `Server error: ${err.message || 'unknown'}` });
  }
};
