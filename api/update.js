const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { txHash, name, description, url, emoji, color, category, icon } = req.body;

  if (!txHash)
    return res.status(400).json({ error: 'Missing transaction hash' });

  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash))
    return res.status(400).json({ error: 'Invalid transaction hash format' });

  if (!name || !name.trim())
    return res.status(400).json({ error: 'Name is required' });

  try {
    await initDB();

    // Verify the cell exists with this tx_hash
    const existing = await sql`SELECT id FROM cells WHERE tx_hash = ${txHash}`;
    if (existing.length === 0)
      return res.status(404).json({ error: 'No cell found with this transaction hash' });

    // Update allowed fields
    await sql`
      UPDATE cells SET
        name        = ${name.slice(0, 50)},
        description = ${(description || '').slice(0, 120)},
        url         = ${url || ''},
        emoji       = ${emoji || '🤖'},
        color       = ${color || '#00ffcc'},
        category    = ${category || 'Other'},
        icon        = ${(icon || '').slice(0, 20000)}
      WHERE tx_hash = ${txHash}
    `;

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};
