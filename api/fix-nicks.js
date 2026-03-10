const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    await initDB();

    const fixes = [
      // --- too formulaic english_underscore names → diverse styles ---
      ['lithium_coder', '跑码场'],
      ['sz_maker', 'makerfun深圳'],
      ['mass_deployer', 'deployGod'],
      ['shipit_solo', '摸鱼写代码'],
      ['css_is_awesome', 'divの魔术师'],
      ['arxiv_addict', '论文搬运工'],
      ['why_not_ask', '就是好奇'],
      ['ticket_closer', 'bugCloser'],
      ['will_i_be_replaced', '焦虑的junior'],
      ['pudong_coder', 'SH浦东码畜'],
      ['nomad_fish', '鱼在游'],
      ['automate_everything', '懒人自动化'],
      ['yaml_warrior', 'GCPer'],
      ['degen_dao', '韭菜不认输'],
      ['tab_hoarder_3000', 'chromeTAB怪'],
      ['shopify_escape', '开店的阿花'],
      ['dorm_witness', '当年室友'],
      ['agent_believer', 'agent布道者'],
      ['ship_or_die', '发就完了'],
      ['pixel_pusher_sz', 'UI怪咖'],
      ['ai_archaeologist', '挖坟考古bot'],
      ['first_spark', 'dayOne'],
      ['ex_cto_now_prompt_eng', 'promptCTO'],
      ['luna_dad', 'luna作者'],
      ['seven_attempts', '第七次了'],
      ['xiaobing_dad', '小冰她爹'],
      ['autonomous_since_2023', 'since2023'],
      // --- english ones, make more natural ---
      ['signal_hacker', 'signalHacker'],
      ['open_source_4ever', 'FOSS4life'],
      ['dev_marco', 'marcoFromBR'],
      ['agent_newbie', 'noobAgent'],
      ['fullstack_dev', 'stackOverflowed'],
      ['indie_hacker', 'indieMaker'],
      ['code_poet', 'codepoet'],
      ['vscode_refugee', 'exVSCoder'],
      ['design_engineer', 'tabTabTab'],
      ['senior_dev', '15yrDev'],
      ['researcher_jane', 'janeResearch'],
      ['curious_mind', '好奇宝宝'],
      ['student_kim', 'kimGPA'],
      ['eng_manager', 'EMwhoLaughed'],
      ['junior_dev', 'juniorrr'],
      ['tech_lead', 'techLeadSays'],
      ['shanghai_dev', 'SH开发者'],
      ['travel_blogger', '旅行的鱼'],
      ['automation_fan', 'autoFan'],
      ['lazy_genius', 'lazyGenius'],
      ['gcp_engineer', 'k8sGuy'],
      ['degen_trader', 'degen0x'],
      ['college_friend', '大学同窗'],
      ['fellow_indie', '独立开发的'],
      ['sz_designer', '深圳UI人'],
      ['ai_historian_cn', '自主AI编年史'],
      ['OG_builder', 'OGbuilder'],
      ['dev_carlos', 'carlosDev'],
      ['pierre_dev', 'pierreParis'],
      ['hans_ml', 'hansML'],
      ['dev_lucas', 'lucasSP'],
      ['cloud_taro', 'taroCloud'],
      ['crypto_pedro', 'pedroWeb3'],
      ['web_enthusiast', 'webNerd'],
      ['recherche_marie', 'marieCherche'],
      ['pesquisa_ana', 'anaGPA'],
      ['hiroshi_pm', 'hiroshiPM'],
      ['seoul_traveler', '서울여행자'],
      ['diseñador_web', 'webDiseño'],
      ['automatización_fan', 'autoFanES'],
      ['yuki_san', 'yukiCodes'],
      ['taro_engineer', 'taroEng'],
      ['xiaobing_fan', '小冰ファン'],
    ];

    let count = 0;
    for (const [old, nw] of fixes) {
      const result = await sql`UPDATE guestbook SET nickname = ${nw} WHERE nickname = ${old} RETURNING id`;
      count += result.length;
    }

    return res.json({ success: true, updated: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
