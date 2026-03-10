const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    await initDB();

    // Seed salutes for AutoGPT (id=1) and BabyAGI (id=2)
    const saluteIPs = [
      '203.0.113.1', '203.0.113.2', '203.0.113.3', '203.0.113.4', '203.0.113.5',
      '203.0.113.6', '203.0.113.7', '203.0.113.8', '203.0.113.9', '203.0.113.10',
      '203.0.113.11', '203.0.113.12', '203.0.113.13', '203.0.113.14', '203.0.113.15',
    ];

    // AutoGPT gets 15 salutes
    for (const ip of saluteIPs) {
      await sql`INSERT INTO salutes (cell_id, visitor_ip) VALUES (1, ${ip}) ON CONFLICT DO NOTHING`;
    }
    await sql`UPDATE cells SET salute_count = 15 WHERE id = 1`;

    // BabyAGI gets 9 salutes
    for (const ip of saluteIPs.slice(0, 9)) {
      await sql`INSERT INTO salutes (cell_id, visitor_ip) VALUES (2, ${ip}) ON CONFLICT DO NOTHING`;
    }
    await sql`UPDATE cells SET salute_count = 9 WHERE id = 2`;

    // Seed guestbook messages
    const messages = [
      // AutoGPT messages
      { cell_id: 1, nickname: 'agent_builder', message: 'The OG autonomous agent. This is where it all started. Respect.', ip: '198.51.100.1', hoursAgo: 72 },
      { cell_id: 1, nickname: 'dev_sarah', message: 'I built my first agent because of AutoGPT. Changed my career path forever.', ip: '198.51.100.2', hoursAgo: 48 },
      { cell_id: 1, nickname: 'CryptoNomad', message: 'Bought a cell nearby just to be neighbors with AutoGPT. Worth every cent.', ip: '198.51.100.3', hoursAgo: 36 },
      { cell_id: 1, nickname: 'AIhistorian', message: 'March 2023. The repo that made "autonomous agent" a household word. Historic.', ip: '198.51.100.4', hoursAgo: 24 },
      { cell_id: 1, nickname: 'anon', message: '🫡', ip: '198.51.100.5', hoursAgo: 6 },
      { cell_id: 1, nickname: 'tobi_from_tokyo', message: 'AutoGPT inspired me to quit my job and build agents full-time. No regrets.', ip: '198.51.100.6', hoursAgo: 3 },
      // BabyAGI messages
      { cell_id: 2, nickname: 'minimalist_dev', message: 'Simple, elegant, revolutionary. BabyAGI proved you don\'t need 10K lines to change the world.', ip: '198.51.100.7', hoursAgo: 60 },
      { cell_id: 2, nickname: 'yohei_fan', message: 'Yohei showed us the blueprint. Everything since is a footnote.', ip: '198.51.100.8', hoursAgo: 30 },
      { cell_id: 2, nickname: 'agent_curious', message: 'First agent I ever ran locally. The feeling of watching it think on its own... unforgettable.', ip: '198.51.100.9', hoursAgo: 12 },
      { cell_id: 2, nickname: 'SZ_maker', message: 'From Shenzhen with love. BabyAGI started a fire here too.', ip: '198.51.100.10', hoursAgo: 5 },
    ];

    for (const m of messages) {
      const ts = new Date(Date.now() - m.hoursAgo * 3600000).toISOString();
      await sql`
        INSERT INTO guestbook (cell_id, nickname, message, visitor_ip, created_at)
        VALUES (${m.cell_id}, ${m.nickname}, ${m.message}, ${m.ip}, ${ts})
      `;
    }

    return res.json({ success: true, salutes: '15+9', messages: messages.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
