const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { txHash, askingPrice, sellerWallet } = req.body;

  if (!txHash || !sellerWallet || !askingPrice)
    return res.status(400).json({ error: 'Missing required fields: txHash, askingPrice, sellerWallet' });

  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash))
    return res.status(400).json({ error: 'Invalid transaction hash' });

  if (!/^0x[0-9a-fA-F]{40}$/.test(sellerWallet))
    return res.status(400).json({ error: 'Invalid wallet address' });

  const price = parseFloat(askingPrice);
  if (isNaN(price) || price < 1)
    return res.status(400).json({ error: 'Asking price must be at least $1' });

  try {
    await initDB();

    const cell = await sql`SELECT id, for_sale FROM cells WHERE tx_hash = ${txHash}`;
    if (cell.length === 0)
      return res.status(404).json({ error: 'No cell found with this transaction hash' });

    if (cell[0].for_sale)
      return res.status(400).json({ error: 'This cell is already listed for sale' });

    await sql`
      UPDATE cells SET
        for_sale = TRUE,
        asking_price = ${price},
        seller_wallet = ${sellerWallet.toLowerCase()}
      WHERE tx_hash = ${txHash}
    `;

    res.json({ ok: true, askingPrice: price, buyerPays: Math.round(price * 1.1 * 100) / 100 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
