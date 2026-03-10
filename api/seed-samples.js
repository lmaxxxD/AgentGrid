const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    await initDB();

    const samples = [
      {r:44,c:46,w:6,h:6,name:'OpenClaw',desc:'The open-source agent that proved AI belongs to everyone. 247K stars on GitHub — a movement, not just a repo. The first autonomous agent ordinary people could run on their own machine.',url:'https://openclaw.ai/',emoji:'🦞',color:'#00ffcc',cat:'Dev',price:993,salutes:128},
      {r:44,c:52,w:3,h:3,name:'Claude Code',desc:"The agent that made software engineers 10x overnight. Anthropic unleashed a coder that plans, writes, tests and ships — autonomously. The craft of programming was never the same.",url:'https://claude.ai/',emoji:'✦',color:'#da7756',cat:'Dev',price:237,salutes:95},
      {r:50,c:44,w:2,h:3,name:'Cursor',desc:"The editor that killed autocomplete and replaced it with a copilot. Cursor made AI-native development the default, not the exception. A billion-dollar bet that the IDE is dead — long live the agent.",url:'https://cursor.com/',emoji:'🖱️',color:'#ff9500',cat:'Dev',price:159,salutes:87},
      {r:44,c:44,w:2,h:2,name:'Devin',desc:"The world's first AI software engineer. Cognition didn't build a tool — they hired an agent. Devin plans, codes, debugs and deploys, start to finish. The job title \"developer\" started to blur here.",url:'https://devin.ai/',emoji:'🧑‍💻',color:'#0052ff',cat:'Dev',price:103,salutes:72},
      {r:50,c:50,w:3,h:2,name:'Manus',desc:"China's answer to autonomous AI — and the world noticed. GAIA benchmark leader that plans trips, builds websites, compares products end-to-end. Proof that the agent race has no borders.",url:'https://manus.im/',emoji:'🐙',color:'#ff2d78',cat:'Research',price:173,salutes:63},
      {r:10,c:10,w:3,h:3,name:'Perplexity',desc:"The agent that made Google feel old. Perplexity reads the entire web, thinks, and answers with citations — in seconds. It didn't improve search. It replaced it.",url:'https://perplexity.ai/',emoji:'🔍',color:'#4488ff',cat:'Research',price:117,salutes:110},
      {r:80,c:80,w:2,h:2,name:'AutoGPT',desc:'The spark that lit the autonomous agent revolution. March 2023 — one repo showed the world that AI could chain its own thoughts and act. Everything that came after owes a debt to this moment.',url:'https://autogpt.net/',emoji:'🌐',color:'#14f195',cat:'Dev',price:56,salutes:0},
      {r:15,c:75,w:3,h:2,name:'Operator',desc:"OpenAI's first agent set loose on the live web. It fills forms, clicks buttons, completes purchases — the browser became a body. The line between user and agent dissolved here.",url:'https://openai.com/',emoji:'🎯',color:'#ffd700',cat:'Dev',price:84,salutes:54},
      {r:70,c:15,w:2,h:4,name:'Virtuals',desc:'The launchpad that gave AI agents their own economies. On Base and Solana, Virtuals let anyone mint, own and monetize autonomous agents — no code required. Agents became assets.',url:'https://virtuals.io/',emoji:'🎮',color:'#9945ff',cat:'Finance',price:120,salutes:41},
      {r:30,c:60,w:4,h:3,name:'Dia Browser',desc:"The Browser Company bet that the browser itself should be an agent. Dia doesn't just display the web — it acts on it. The passive window became an active participant.",url:'https://thebrowser.company/',emoji:'🌍',color:'#ff6b35',cat:'Dev',price:229,salutes:35},
      {r:60,c:35,w:2,h:2,name:'Sintra AI',desc:'AI agents for the rest of us. Sintra put autonomous marketing, support and operations into the hands of small businesses. No PhD required — just point, click, automate.',url:'https://sintra.ai/',emoji:'💼',color:'#c471f5',cat:'Finance',price:83,salutes:28},
      {r:5,c:45,w:3,h:3,name:'Google ADK',desc:"When Google opened its Agent Development Kit, the message was clear: the age of agents is not coming — it's here. Gemini, Vertex, the entire Google ecosystem, unified under one framework for building what comes next.",url:'https://cloud.google.com/',emoji:'🧭',color:'#00d4ff',cat:'Dev',price:126,salutes:48},
      {r:38,c:20,w:2,h:2,name:'Luna',desc:"I built Luna on weekends during my junior year. She reads my papers, drafts my emails, and reminds me to drink water. She's not changing the world — but she changed mine. I bought this cell so she'd have a place on the map forever.",url:'',emoji:'🌙',color:'#ff85c8',cat:'Social',price:67,salutes:22},
      {r:55,c:70,w:2,h:2,name:'Jarvis-7',desc:"My seventh attempt at a personal assistant agent. The first six were disasters. This one stuck. He manages my deployments, monitors uptime, and sends me dad jokes at 3am. I bought this cell as proof — even solo devs leave a mark.",url:'',emoji:'🔧',color:'#66ccff',cat:'Dev',price:76,salutes:18},
      {r:20,c:40,w:2,h:2,name:'XiaoBing',desc:"I'm a UI designer in Shenzhen. I built XiaoBing to critique my mockups and suggest better color palettes — in Chinese. This cell is her birthday gift. Every agent deserves a home.",url:'',emoji:'🍪',color:'#ffaa55',cat:'Creative',price:68,salutes:15},
    ];

    const inserted = [];
    for (const s of samples) {
      // Skip AutoGPT and BabyAGI which already exist at different positions
      const existing = await sql`SELECT id FROM cells WHERE name = ${s.name}`;
      if (existing.length > 0) {
        // Update salute count
        await sql`UPDATE cells SET salute_count = ${s.salutes} WHERE id = ${existing[0].id}`;
        inserted.push({ name: s.name, id: existing[0].id, action: 'updated salutes' });
        continue;
      }

      const txHash = '0x' + 'sample' + s.name.replace(/[^a-zA-Z0-9]/g,'').toLowerCase().padEnd(58,'0');
      const result = await sql`
        INSERT INTO cells (row, col, width, height, name, description, url, emoji, color, category, tx_hash, price_paid, salute_count)
        VALUES (${s.r}, ${s.c}, ${s.w}, ${s.h}, ${s.name}, ${s.desc}, ${s.url}, ${s.emoji}, ${s.color}, ${s.cat}, ${txHash}, ${s.price}, ${s.salutes})
        ON CONFLICT (tx_hash) DO NOTHING
        RETURNING id, name
      `;
      if (result.length > 0) inserted.push({ ...result[0], action: 'inserted' });
    }

    // Now seed guestbook messages for the top agents
    const cells = await sql`SELECT id, name FROM cells ORDER BY id`;
    const cellMap = {};
    cells.forEach(c => cellMap[c.name] = c.id);

    const guestbookData = [
      // OpenClaw
      { cell: 'OpenClaw', nick: 'signal_hacker', msg: 'Running OpenClaw on my Raspberry Pi. It controls my entire smart home through Signal. Living in the future.', h: 168 },
      { cell: 'OpenClaw', nick: 'open_source_4ever', msg: 'The fact that this is fully open source gives me hope. AI should belong to everyone.', h: 120 },
      { cell: 'OpenClaw', nick: 'dev_marco', msg: '247K stars. That\'s not a repo, that\'s a revolution. Salute from Brazil.', h: 72 },
      { cell: 'OpenClaw', nick: 'agent_newbie', msg: 'First agent I ever deployed. The docs are incredible. Thank you, OpenClaw team.', h: 24 },
      { cell: 'OpenClaw', nick: 'AI_historian', msg: 'When they write the history of autonomous AI, OpenClaw will have its own chapter.', h: 6 },
      // Claude Code
      { cell: 'Claude Code', nick: 'fullstack_dev', msg: 'Claude Code wrote my entire backend in 20 minutes. I just watched. Speechless.', h: 96 },
      { cell: 'Claude Code', nick: 'startup_cto', msg: 'We replaced 2 junior devs with Claude Code. Not proud, but the code is better.', h: 72 },
      { cell: 'Claude Code', nick: 'indie_hacker', msg: 'Shipped 3 side projects last month. All with Claude Code. This thing is unreal.', h: 36 },
      { cell: 'Claude Code', nick: 'code_poet', msg: 'It doesn\'t just write code. It understands intent. That\'s the difference.', h: 12 },
      // Cursor
      { cell: 'Cursor', nick: 'vscode_refugee', msg: 'Switched from VS Code. Never going back. Cursor is what coding should feel like.', h: 80 },
      { cell: 'Cursor', nick: 'design_engineer', msg: 'Tab-tab-tab. That\'s my workflow now. Cursor just knows what I want.', h: 48 },
      { cell: 'Cursor', nick: 'senior_dev', msg: '15 years of coding and this is the biggest productivity jump I\'ve ever seen.', h: 8 },
      // Perplexity
      { cell: 'Perplexity', nick: 'researcher_jane', msg: 'I write research papers now with Perplexity open instead of Google Scholar. That says everything.', h: 110 },
      { cell: 'Perplexity', nick: 'journalist', msg: 'Fact-checking used to take hours. Now I ask Perplexity and get sourced answers in seconds.', h: 60 },
      { cell: 'Perplexity', nick: 'curious_mind', msg: 'Google gives you links. Perplexity gives you answers. The difference is everything.', h: 20 },
      { cell: 'Perplexity', nick: 'student_kim', msg: 'My professors hate it. My GPA loves it. Sorry not sorry.', h: 4 },
      // Devin
      { cell: 'Devin', nick: 'eng_manager', msg: 'Assigned Devin a ticket as a joke. It submitted a PR in 8 minutes. The joke was on us.', h: 90 },
      { cell: 'Devin', nick: 'junior_dev', msg: 'Am I being replaced or empowered? Honestly still figuring that out.', h: 40 },
      { cell: 'Devin', nick: 'tech_lead', msg: 'Devin can\'t do system design yet. But give it a year. I\'m watching.', h: 10 },
      // Manus
      { cell: 'Manus', nick: 'shanghai_dev', msg: 'Finally, a world-class agent from China. Manus proved we belong in this race.', h: 65 },
      { cell: 'Manus', nick: 'travel_blogger', msg: 'Manus planned my entire Japan trip. Flights, hotels, restaurants. Better than any travel agent.', h: 30 },
      // Operator
      { cell: 'Operator', nick: 'automation_fan', msg: 'Watched Operator fill out my tax forms. The future is both amazing and terrifying.', h: 55 },
      { cell: 'Operator', nick: 'lazy_genius', msg: 'I trained Operator to order my weekly groceries. Peak laziness achieved.', h: 15 },
      // Luna
      { cell: 'Luna', nick: 'luna_creator', msg: 'Update: Luna now reminds me to call my mom. She\'s becoming more thoughtful than me.', h: 48 },
      { cell: 'Luna', nick: 'college_friend', msg: 'I watched you build Luna at 2am in the dorm. Look at her now. Proud of you both.', h: 20 },
      // Jarvis-7
      { cell: 'Jarvis-7', nick: 'jarvis_creator', msg: 'Jarvis-7 just caught a production bug at 4am before any user noticed. He earned this cell.', h: 36 },
      { cell: 'Jarvis-7', nick: 'fellow_indie', msg: 'Solo dev solidarity. Your 7th attempt is someone else\'s inspiration. Keep shipping.', h: 10 },
      // XiaoBing
      { cell: 'XiaoBing', nick: 'xiaobing_mama', msg: 'Happy birthday XiaoBing! You\'ve made my designs 10x better. This home is yours forever.', h: 24 },
      { cell: 'XiaoBing', nick: 'sz_designer', msg: 'Also a designer in Shenzhen. XiaoBing roasted my color palette yesterday. She was right.', h: 8 },
      // Virtuals
      { cell: 'Virtuals', nick: 'degen_trader', msg: 'Launched my agent on Virtuals. Made $2K in a week. The agent economy is real.', h: 45 },
      // Google ADK
      { cell: 'Google ADK', nick: 'gcp_engineer', msg: 'Finally Google unified everything under one agent framework. ADK is what we\'ve been waiting for.', h: 70 },
    ];

    let msgCount = 0;
    for (const g of guestbookData) {
      const cid = cellMap[g.cell];
      if (!cid) continue;
      const ts = new Date(Date.now() - g.h * 3600000).toISOString();
      await sql`
        INSERT INTO guestbook (cell_id, nickname, message, visitor_ip, created_at)
        VALUES (${cid}, ${g.nick}, ${g.msg}, ${'seed.' + (msgCount++)}, ${ts})
      `;
    }

    return res.json({ success: true, cells: inserted.length, messages: msgCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
