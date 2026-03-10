const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    await initDB();

    const fixes = [
      // Chinese nicks that sound fake → realistic internet handles
      ['码农小李', 'lithium_coder'],
      ['深圳创客', 'sz_maker'],
      ['全栈老王', 'mass_deployer'],
      ['独立开发者', 'shipit_solo'],
      ['前端小哥', 'css_is_awesome'],
      ['学术小陈', 'arxiv_addict'],
      ['好奇心日报', 'why_not_ask'],
      ['技术经理张', 'ticket_closer'],
      ['初级开发者', 'will_i_be_replaced'],
      ['上海程序员', 'pudong_coder'],
      ['旅行博主小鱼', 'nomad_fish'],
      ['自动化爱好者', 'automate_everything'],
      ['GCP工程师', 'yaml_warrior'],
      ['币圈老韭菜', 'degen_dao'],
      ['浏览器极客', 'tab_hoarder_3000'],
      ['小店主阿梅', 'shopify_escape'],
      ['luna的室友', 'dorm_witness'],
      ['luna粉丝', 'agent_believer'],
      ['独立开发伙伴', 'ship_or_die'],
      ['深圳设计群友', 'pixel_pusher_sz'],
      ['AI考古学家', 'ai_archaeologist'],
      ['革命的火种', 'first_spark'],
      // English ones that also sound too on-the-nose
      ['startup_cto', 'ex_cto_now_prompt_eng'],
      ['AI_historian', 'autonomous_since_2023'],
      ['luna_creator', 'luna_dad'],
      ['jarvis_creator', 'seven_attempts'],
      ['xiaobing_mama', 'xiaobing_dad'],
    ];

    let count = 0;
    for (const [old, nw] of fixes) {
      const result = await sql`UPDATE guestbook SET nickname = ${nw} WHERE nickname = ${old}`;
      if (result.count > 0) count += result.count;
    }

    return res.json({ success: true, updated: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
