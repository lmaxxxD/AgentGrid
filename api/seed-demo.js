const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();

  // Simple secret to prevent abuse
  if (req.body.secret !== 'agentgrid2026') return res.status(403).json({ error: 'Forbidden' });

  try {
    await initDB();

    // Insert two demo cells and mark them for sale
    const demos = [
      {
        row: 48, col: 48, width: 2, height: 2,
        name: 'AutoGPT', description: 'Autonomous AI agent framework', url: 'https://autogpt.net',
        emoji: '🧠', color: '#ff6b35', category: 'Framework',
        tx_hash: '0x' + 'a1'.repeat(32), price_paid: 25,
        for_sale: true, asking_price: 50, seller_wallet: '0x6fc3e15f1901af02a986bccd3201f345bb4a4bff'
      },
      {
        row: 45, col: 52, width: 2, height: 2,
        name: 'BabyAGI', description: 'Task-driven autonomous agent', url: 'https://babyagi.org',
        emoji: '👶', color: '#a855f7', category: 'Agent',
        tx_hash: '0x' + 'b2'.repeat(32), price_paid: 30,
        for_sale: true, asking_price: 75, seller_wallet: '0x6fc3e15f1901af02a986bccd3201f345bb4a4bff'
      }
    ];

    const results = [];
    for (const d of demos) {
      // Upsert - skip if tx_hash already exists
      const existing = await sql`SELECT id FROM cells WHERE tx_hash = ${d.tx_hash}`;
      if (existing.length > 0) {
        // Just update for_sale status
        await sql`UPDATE cells SET for_sale = TRUE, asking_price = ${d.asking_price}, seller_wallet = ${d.seller_wallet} WHERE tx_hash = ${d.tx_hash}`;
        results.push({ name: d.name, status: 'updated' });
      } else {
        await sql`
          INSERT INTO cells (row, col, width, height, name, description, url, emoji, color, category, tx_hash, price_paid, for_sale, asking_price, seller_wallet)
          VALUES (${d.row}, ${d.col}, ${d.width}, ${d.height}, ${d.name}, ${d.description}, ${d.url}, ${d.emoji}, ${d.color}, ${d.category}, ${d.tx_hash}, ${d.price_paid}, ${d.for_sale}, ${d.asking_price}, ${d.seller_wallet})
        `;
        results.push({ name: d.name, status: 'inserted' });
      }
    }

    res.json({ ok: true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
