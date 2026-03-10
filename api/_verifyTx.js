const WALLET       = (process.env.WALLET_ADDRESS || '0x6fC3E15f1901AF02A986BccD3201f345BB4A4bfF').toLowerCase();
const BASE_RPC     = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const USDC         = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const USDT         = '0xfde4c96c680539616096dba9a22a4b266024ac2d';
const TRANSFER_SIG = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

async function rpcCall(method, params) {
  const res = await fetch(BASE_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'RPC error');
  return json.result;
}

async function verifyTransaction(txHash, expectedUSD) {
  const receipt = await rpcCall('eth_getTransactionReceipt', [txHash]);
  if (!receipt)              return { ok: false, error: 'Transaction not found or still pending' };
  if (receipt.status !== '0x1')  return { ok: false, error: 'Transaction failed on-chain' };

  const currentBlock  = parseInt(await rpcCall('eth_blockNumber', []), 16);
  const txBlock       = parseInt(receipt.blockNumber, 16);
  const confirmations = currentBlock - txBlock;
  if (confirmations < 3)     return { ok: false, error: `Only ${confirmations} confirmation(s) — please wait a moment and retry` };

  for (const log of receipt.logs) {
    const addr = log.address.toLowerCase();
    if (addr !== USDC && addr !== USDT)  continue;
    if (log.topics[0] !== TRANSFER_SIG) continue;
    if (log.topics.length < 3)          continue;

    const toAddr = '0x' + log.topics[2].slice(26).toLowerCase();
    if (toAddr !== WALLET) continue;

    const amountUSD = Number(BigInt(log.data)) / 1_000_000;
    if (amountUSD >= expectedUSD * 0.99) {
      return { ok: true, amountUSD, token: addr === USDC ? 'USDC' : 'USDT' };
    }
  }

  return { ok: false, error: `No matching USDC/USDT transfer ≥ $${expectedUSD.toFixed(2)} found to the platform wallet` };
}

module.exports = { verifyTransaction };
