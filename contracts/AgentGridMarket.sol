// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * AgentGrid Marketplace — Decentralized Resale Contract
 *
 * Buyer calls buy() → contract pulls USDC/USDT from buyer via transferFrom
 *   → 90% sent to seller
 *   → 10% sent to platform
 *
 * Requires buyer to approve() this contract first.
 * Deployed on Base mainnet.
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AgentGridMarket {
    address public owner;
    address public platformWallet;
    uint256 public platformFeeBps = 1000; // 10% = 1000 / 10000

    IERC20 public immutable usdc;
    IERC20 public immutable usdt;

    event CellPurchased(
        uint256 indexed cellId,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 sellerAmount,
        uint256 platformFee
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _platformWallet, address _usdc, address _usdt) {
        owner = msg.sender;
        platformWallet = _platformWallet;
        usdc = IERC20(_usdc);
        usdt = IERC20(_usdt);
    }

    /**
     * @notice Buy a resale cell with USDC
     * @param cellId Database ID of the cell
     * @param seller Seller's wallet address (receives 90%)
     * @param totalAmount Total amount in USDC (6 decimals) — this is the seller's asking price
     *        Platform fee is calculated on top: buyer must approve totalAmount * 110 / 100
     */
    function buyWithUSDC(uint256 cellId, address seller, uint256 totalAmount) external {
        _buy(cellId, seller, totalAmount, usdc);
    }

    /**
     * @notice Buy a resale cell with USDT
     */
    function buyWithUSDT(uint256 cellId, address seller, uint256 totalAmount) external {
        _buy(cellId, seller, totalAmount, usdt);
    }

    function _buy(uint256 cellId, address seller, uint256 sellerAmount, IERC20 token) internal {
        require(seller != address(0), "Invalid seller");
        require(sellerAmount > 0, "Amount must be > 0");

        uint256 fee = (sellerAmount * platformFeeBps) / 10000;

        // Pull sellerAmount to seller directly
        require(token.transferFrom(msg.sender, seller, sellerAmount), "Seller payment failed");
        // Pull fee to platform
        require(token.transferFrom(msg.sender, platformWallet, fee), "Fee payment failed");

        emit CellPurchased(cellId, msg.sender, seller, address(token), sellerAmount, fee);
    }

    // ── Admin ──

    function setPlatformWallet(address _wallet) external onlyOwner {
        platformWallet = _wallet;
    }

    function setFeeBps(uint256 _bps) external onlyOwner {
        require(_bps <= 2000, "Fee too high"); // max 20%
        platformFeeBps = _bps;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
