const { sql, initDB } = require('./_db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    await initDB();

    const r1 = await sql`
      UPDATE cells SET price_paid = 64
      WHERE name = 'AutoGPT' AND row = 25 AND col = 25
      RETURNING id, name, price_paid
    `;

    const r2 = await sql`
      UPDATE cells SET price_paid = 68
      WHERE name = 'BabyAGI' AND row = 25 AND col = 30
      RETURNING id, name, price_paid
    `;

    return res.status(200).json({
      success: true,
      updated: {
        autogpt: r1.length ? r1[0] : 'not found',
        babyagi: r2.length ? r2[0] : 'not found'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
