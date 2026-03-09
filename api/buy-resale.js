const { sql, initDB }       = require('./_db');
const { verifyTransaction } = require('./_verifyTx');

const PLATFORM_FEE_RATE = 0.10; // 10%

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { cellId, buyerTxHash, name, description, url, emoji, color, category } = req.body;

  if (!cellId || !buyerTxHash)
    return res.status(400).json({ error: 'Missing cellId or buyerTxHash' });

  if (!/^0x[0-9a-fA-F]{64}$/.test(buyerTxHash))
    return res.status(400).json({ error: 'Invalid transaction hash format' });

  try {
    await initDB();

    // Check tx_hash not already used
    const txUsed = await sql`SELECT id FROM cells WHERE tx_hash = ${buyerTxHash}`;
    if (txUsed.length > 0)
      return res.status(400).json({ error: 'Transaction hash already used' });

    // Get the cell
    const cells = await sql`SELECT * FROM cells WHERE id = ${cellId}`;
    if (cells.length === 0)
      return res.status(404).json({ error: 'Cell not found' });

    const cell = cells[0];
    if (!cell.for_sale)
      return res.status(400).json({ error: 'This cell is not for sale' });

    // Buyer pays: asking_price + 10% platform fee, all to platform wallet
    const askingPrice = cell.asking_price;
    const platformFee = Math.round(askingPrice * PLATFORM_FEE_RATE * 100) / 100;
    const totalBuyerPays = Math.round((askingPrice + platformFee) * 100) / 100;

    // Verify on-chain payment to platform wallet
    const result = await verifyTransaction(buyerTxHash, totalBuyerPays);
    if (!result.ok)
      return res.status(400).json({ error: result.error });

    // Record settlement (money owed to seller)
    await sql`
      INSERT INTO settlements (cell_id, seller_wallet, amount, platform_fee, buyer_tx_hash)
      VALUES (${cell.id}, ${cell.seller_wallet}, ${askingPrice}, ${platformFee}, ${buyerTxHash})
    `;

    // Transfer ownership: update tx_hash to buyer's, clear sale status
    await sql`
      UPDATE cells SET
        tx_hash       = ${buyerTxHash},
        price_paid    = ${totalBuyerPays},
        for_sale      = FALSE,
        asking_price  = 0,
        seller_wallet = '',
        name          = ${(name || cell.name).slice(0, 50)},
        description   = ${(description || cell.description).slice(0, 120)},
        url           = ${url || cell.url},
        emoji         = ${emoji || cell.emoji},
        color         = ${color || cell.color},
        category      = ${category || cell.category},
        confirmed_at  = NOW()
      WHERE id = ${cellId}
    `;

    res.json({
      ok: true,
      paid: totalBuyerPays,
      platformFee,
      sellerGets: askingPrice
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
