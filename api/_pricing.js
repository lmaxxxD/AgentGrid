const ROWS = 100, COLS = 100, BASE_PRICE = 10;
const MAX_DIST = Math.sqrt(49.5 ** 2 + 49.5 ** 2);
const TIERS = [
  { min: 0,    mult: 1.0 },
  { min: 1000, mult: 1.3 },
  { min: 2500, mult: 1.7 },
  { min: 5000, mult: 2.2 },
  { min: 7500, mult: 3.0 },
];

function getTierMult(sold) {
  for (let i = TIERS.length - 1; i >= 0; i--)
    if (sold >= TIERS[i].min) return TIERS[i].mult;
  return 1.0;
}

function posMultiplier(r, c) {
  const d = Math.sqrt((r - 49.5) ** 2 + (c - 49.5) ** 2) / MAX_DIST;
  return 1 + 2 * Math.exp(-2.5 * d);
}

function cellPrice(r, c, sold) {
  return Math.max(BASE_PRICE, Math.round(BASE_PRICE * posMultiplier(r, c) * getTierMult(sold)));
}

module.exports = { cellPrice, ROWS, COLS };
