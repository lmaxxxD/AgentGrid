const { sql, initDB } = require('./_db');

module.exports = async function handler(req, res) {
  try {
    await initDB();
    const rows = await sql`SELECT id, name, row, col, price_paid, for_sale, asking_price FROM cells`;
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
