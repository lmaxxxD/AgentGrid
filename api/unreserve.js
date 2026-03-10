const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { reservationId } = req.body;
  if (!reservationId) return res.status(400).json({ error: 'Missing reservationId' });

  try {
    await initDB();
    await sql`DELETE FROM reservations WHERE id = ${reservationId}`;
    res.json({ ok: true });
  } catch (err) {
    console.error('UNRESERVE ERROR:', err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
};
