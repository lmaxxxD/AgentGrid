const { sql, initDB } = require('./_db');
const { cellPrice } = require('./_pricing');

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

    const cell = await sql`SELECT id, row, col, width, height, for_sale FROM cells WHERE tx_hash = ${txHash}`;
    if (cell.length === 0)
      return res.status(404).json({ error: 'No cell found with this transaction hash' });

    if (cell[0].for_sale)
      return res.status(400).json({ error: 'This cell is already listed for sale' });

    // Calculate minimum asking price = current new-purchase price for this block
    const sold = await sql`SELECT COUNT(*) AS cnt FROM cells`;
    const totalSold = parseInt(sold[0].cnt);
    let minPrice = 0;
    for (let r = cell[0].row; r < cell[0].row + cell[0].height; r++)
      for (let c = cell[0].col; c < cell[0].col + cell[0].width; c++)
        minPrice += cellPrice(r, c, totalSold);

    if (price < minPrice)
      return res.status(400).json({ error: `Asking price must be at least $${minPrice} (current market price for this position)`, minPrice });

    await sql`
      UPDATE cells SET
        for_sale = TRUE,
        asking_price = ${price},
        seller_wallet = ${sellerWallet.toLowerCase()}
      WHERE tx_hash = ${txHash}
    `;

    res.json({ ok: true, askingPrice: price, minPrice, buyerPays: Math.round(price * 1.1 * 100) / 100 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
