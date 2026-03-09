const { sql, initDB } = require('./_db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    await initDB();

    // Move AutoGPT (currently row=48, col=48) → row=25, col=25
    const r1 = await sql`
      UPDATE cells SET row = 25, col = 25
      WHERE name = 'AutoGPT' AND row = 48 AND col = 48
      RETURNING id, name, row, col
    `;

    // Move BabyAGI (currently row=45, col=52) → row=25, col=30
    const r2 = await sql`
      UPDATE cells SET row = 25, col = 30
      WHERE name = 'BabyAGI' AND row = 45 AND col = 52
      RETURNING id, name, row, col
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
