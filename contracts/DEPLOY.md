# Deploy AgentGridMarket on Base Mainnet

## Constructor Parameters
- `_platformWallet`: `0x6fC3E15f1901AF02A986BccD3201f345BB4A4bfF`
- `_usdc`: `0x833589fcd6eDb6E08f4c7C32D4f71b54bdA02913` (USDC on Base)
- `_usdt`: `0xfde4C96c680539616096DBa9a22a4b266024ac2d` (USDT on Base)

## Deploy via Remix (fastest)
1. Go to https://remix.ethereum.org
2. Create new file, paste AgentGridMarket.sol
3. Compile with Solidity 0.8.20+
4. Deploy → Environment: "Injected Provider" (MetaMask on Base)
5. Fill constructor args and deploy
6. Copy the deployed contract address
7. Update `MARKET_CONTRACT` in index.html

## How it works
- Buyer connects wallet → approves USDC spending → calls buy()
- Contract pulls USDC from buyer: 90% to seller, 10% to platform
- CellPurchased event emitted → backend verifies and transfers ownership
