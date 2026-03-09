const { sql, initDB } = require('./_db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    await initDB();

    const r1 = await sql`
      UPDATE cells SET asking_price = 99
      WHERE name = 'AutoGPT' AND for_sale = true
      RETURNING id, name, price_paid, asking_price
    `;

    const r2 = await sql`
      UPDATE cells SET asking_price = 120
      WHERE name = 'BabyAGI' AND for_sale = true
      RETURNING id, name, price_paid, asking_price
    `;

    return res.status(200).json({
      autogpt: r1.length ? r1[0] : 'not found',
      babyagi: r2.length ? r2[0] : 'not found'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
