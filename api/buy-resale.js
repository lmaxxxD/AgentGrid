const { sql, initDB }   = require('./_db');
const { ethers }        = require('ethers');

const BASE_RPC        = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const MARKET_CONTRACT = (process.env.MARKET_CONTRACT || '').toLowerCase();

// CellPurchased(uint256 cellId, address buyer, address seller, address token, uint256 sellerAmount, uint256 platformFee)
const CELL_PURCHASED_TOPIC = ethers.id('CellPurchased(uint256,address,address,address,uint256,uint256)');

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

  if (!MARKET_CONTRACT)
    return res.status(500).json({ error: 'Marketplace contract not configured' });

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

    // Verify on-chain: look for CellPurchased event from marketplace contract
    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const receipt  = await provider.getTransactionReceipt(buyerTxHash);

    if (!receipt)
      return res.status(400).json({ error: 'Transaction not found or still pending' });
    if (receipt.status !== 1)
      return res.status(400).json({ error: 'Transaction failed on-chain' });

    const currentBlock  = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;
    if (confirmations < 3)
      return res.status(400).json({ error: `Only ${confirmations} confirmation(s) — please wait and retry` });

    // Find CellPurchased event from our marketplace contract
    let verified = false;
    let buyerAddr = '';
    let paidToSeller = 0;
    let paidFee = 0;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== MARKET_CONTRACT) continue;
      if (log.topics[0] !== CELL_PURCHASED_TOPIC) continue;

      // Decode indexed params: cellId, buyer, seller
      const eventCellId = parseInt(log.topics[1], 16);
      buyerAddr = '0x' + log.topics[2].slice(26).toLowerCase();
      const sellerAddr = '0x' + log.topics[3].slice(26).toLowerCase();

      // Decode non-indexed: token, sellerAmount, platformFee
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['address', 'uint256', 'uint256'],
        log.data
      );
      paidToSeller = Number(decoded[1]) / 1_000_000; // USDC/USDT have 6 decimals
      paidFee      = Number(decoded[2]) / 1_000_000;

      // Verify cell ID and seller match
      if (eventCellId === cell.id && sellerAddr === cell.seller_wallet.toLowerCase()) {
        // Verify amount matches asking price (allow 1% tolerance)
        if (paidToSeller >= cell.asking_price * 0.99) {
          verified = true;
          break;
        }
      }
    }

    if (!verified)
      return res.status(400).json({ error: 'No valid CellPurchased event found for this cell. Ensure you used the marketplace contract.' });

    // Transfer ownership
    await sql`
      UPDATE cells SET
        tx_hash       = ${buyerTxHash},
        price_paid    = ${paidToSeller + paidFee},
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
      buyer: buyerAddr,
      paidToSeller,
      platformFee: paidFee
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};
