const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { txHash } = req.body;

  if (!txHash)
    return res.status(400).json({ error: 'Missing txHash' });

  try {
    await initDB();

    const cell = await sql`SELECT id, for_sale FROM cells WHERE tx_hash = ${txHash}`;
    if (cell.length === 0)
      return res.status(404).json({ error: 'No cell found with this transaction hash' });

    if (!cell[0].for_sale)
      return res.status(400).json({ error: 'This cell is not listed for sale' });

    await sql`
      UPDATE cells SET for_sale = FALSE, asking_price = 0, seller_wallet = ''
      WHERE tx_hash = ${txHash}
    `;

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
