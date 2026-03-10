const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')     return res.status(405).end();

  try {
    await initDB();
    const cells = await sql`SELECT * FROM cells ORDER BY confirmed_at ASC`;
    res.json({ cells });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};
