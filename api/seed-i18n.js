const { sql, initDB } = require('./_db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    await initDB();

    const cells = await sql`SELECT id, name FROM cells ORDER BY id`;
    const m = {};
    cells.forEach(c => m[c.name] = c.id);

    const msgs = [
      // OpenClaw — global fame, many languages
      { cell:'OpenClaw', nick:'码农小李', msg:'在自己的树莓派上跑起来了，控制全屋智能家居，开源万岁！', h:200 },
      { cell:'OpenClaw', nick:'深圳创客', msg:'247K star不是数字，是一场运动。从深圳致敬。', h:150 },
      { cell:'OpenClaw', nick:'tanaka_dev', msg:'オープンソースの未来がここにある。日本からも応援しています。', h:130 },
      { cell:'OpenClaw', nick:'パク・ジフン', msg:'한국 개발자도 OpenClaw 쓰고 있습니다. 오픈소스 최고!', h:95 },
      { cell:'OpenClaw', nick:'dev_carlos', msg:'Ejecutando OpenClaw en mi servidor local. ¡El código abierto cambiará el mundo!', h:85 },
      { cell:'OpenClaw', nick:'pierre_dev', msg:'L\'open source à son meilleur. Merci OpenClaw, depuis Paris.', h:60 },
      { cell:'OpenClaw', nick:'hans_ml', msg:'Läuft auf meinem Homeserver seit 3 Monaten. Absolut stabil. Danke!', h:40 },
      { cell:'OpenClaw', nick:'dev_lucas', msg:'Rodando no meu servidor em São Paulo. Open source é o caminho!', h:30 },

      // Claude Code
      { cell:'Claude Code', nick:'全栈老王', msg:'昨天让Claude Code写了整个后端，20分钟搞定。我只是在旁边看着。', h:140 },
      { cell:'Claude Code', nick:'独立开发者', msg:'上个月用Claude Code发了3个副业项目，这东西太离谱了。', h:88 },
      { cell:'Claude Code', nick:'yuki_san', msg:'コードを書くんじゃない、意図を理解するんだ。それが違い。', h:50 },
      { cell:'Claude Code', nick:'김서연', msg:'Claude Code 덕분에 백엔드 개발 시간이 반으로 줄었어요.', h:30 },

      // Cursor
      { cell:'Cursor', nick:'前端小哥', msg:'从VS Code转过来的，再也回不去了。Tab-Tab-Tab就是我的工作流。', h:100 },
      { cell:'Cursor', nick:'taro_engineer', msg:'15年コーディングしてきて、これが一番大きな生産性向上だ。', h:55 },
      { cell:'Cursor', nick:'diseñador_web', msg:'Cursor sabe lo que quiero antes de que lo escriba. Increíble.', h:25 },

      // Perplexity
      { cell:'Perplexity', nick:'学术小陈', msg:'现在写论文直接开Perplexity而不是Google Scholar，这说明一切。', h:130 },
      { cell:'Perplexity', nick:'好奇心日报', msg:'谷歌给你链接，Perplexity给你答案。差别就是一切。', h:75 },
      { cell:'Perplexity', nick:'recherche_marie', msg:'La vérification des faits prenait des heures. Maintenant, quelques secondes avec Perplexity.', h:45 },
      { cell:'Perplexity', nick:'pesquisa_ana', msg:'Meus professores odeiam. Meu GPA adora. Desculpa, não desculpa.', h:15 },

      // Devin
      { cell:'Devin', nick:'技术经理张', msg:'开玩笑把一个ticket分配给Devin，8分钟交了PR。笑话开在我们身上了。', h:100 },
      { cell:'Devin', nick:'初级开发者', msg:'我是在被替代还是被赋能？说实话还在想。', h:50 },
      { cell:'Devin', nick:'hiroshi_pm', msg:'Devinにチケットを割り当てたら8分でPRが来た。冗談のつもりだったのに。', h:20 },

      // Manus
      { cell:'Manus', nick:'上海程序员', msg:'终于有一个世界级的中国Agent了。Manus证明了我们属于这场竞赛。', h:80 },
      { cell:'Manus', nick:'旅行博主小鱼', msg:'Manus帮我规划了整个日本行程，机票酒店餐厅全包，比任何旅行社都好。', h:40 },
      { cell:'Manus', nick:'seoul_traveler', msg:'마누스가 도쿄 여행 전부 계획해줬어요. 항공편, 호텔, 맛집까지. 완벽!', h:18 },

      // Operator
      { cell:'Operator', nick:'自动化爱好者', msg:'看着Operator帮我填税表，未来既惊艳又恐怖。', h:70 },
      { cell:'Operator', nick:'automatización_fan', msg:'Entrené a Operator para pedir mis compras semanales. Máxima pereza lograda.', h:25 },

      // Google ADK
      { cell:'Google ADK', nick:'GCP工程师', msg:'Google终于把一切统一在一个Agent框架下了。ADK就是我们一直在等的东西。', h:90 },
      { cell:'Google ADK', nick:'cloud_taro', msg:'GeminiとVertex、全部がADKで統一された。待ってました。', h:35 },

      // Virtuals
      { cell:'Virtuals', nick:'币圈老韭菜', msg:'在Virtuals上发了个Agent，一周赚了2K刀。Agent经济是真的。', h:55 },
      { cell:'Virtuals', nick:'crypto_pedro', msg:'Lancei meu agente na Virtuals. A economia de agentes é real!', h:20 },

      // Dia Browser
      { cell:'Dia Browser', nick:'浏览器极客', msg:'浏览器本身就应该是Agent。Dia不只是显示网页——它在替你行动。', h:50 },
      { cell:'Dia Browser', nick:'web_enthusiast', msg:'Das passive Fenster wurde zum aktiven Teilnehmer. Dia ist die Zukunft.', h:15 },

      // Sintra AI
      { cell:'Sintra AI', nick:'小店主阿梅', msg:'不用懂技术，点几下就能自动化营销和客服。小商家的福音。', h:35 },

      // Luna
      { cell:'Luna', nick:'luna的室友', msg:'看你在宿舍凌晨2点搭Luna，看看她现在。为你们俩骄傲。', h:28 },
      { cell:'Luna', nick:'luna粉丝', msg:'一个大学生的周末项目，却让我相信了每个人都能做Agent。', h:10 },

      // Jarvis-7
      { cell:'Jarvis-7', nick:'独立开发伙伴', msg:'独立开发者团结！你的第七次尝试就是别人的灵感。继续发布！', h:14 },

      // XiaoBing
      { cell:'XiaoBing', nick:'深圳设计群友', msg:'也是深圳设计师。昨天小冰吐槽了我的配色方案。她说得对。', h:12 },
      { cell:'XiaoBing', nick:'xiaobing_fan', msg:'デザインAIが中国語で動くなんて素晴らしい。深センから応援！', h:5 },

      // AutoGPT
      { cell:'AutoGPT', nick:'AI考古学家', msg:'2023年3月，一个repo向世界证明AI可以自主思考和行动。之后的一切都源于此。', h:110 },
      { cell:'AutoGPT', nick:'革命的火种', msg:'当人们书写自主AI的历史，AutoGPT会有自己的章节。', h:60 },
      { cell:'AutoGPT', nick:'OG_builder', msg:'The spark that lit the fire. Everything after owes a debt to this moment.', h:180 },

      // BabyAGI
      { cell:'BabyAGI', nick:'初心者dev', msg:'BabyAGIのおかげでAIエージェントに興味を持ちました。原点に敬礼。', h:90 },
      { cell:'BabyAGI', nick:'ai_historian_cn', msg:'如果说AutoGPT点了火，BabyAGI就是让火种传播开来的风。', h:45 },
    ];

    let count = 0;
    for (const g of msgs) {
      const cid = m[g.cell];
      if (!cid) continue;
      const ts = new Date(Date.now() - g.h * 3600000).toISOString();
      await sql`
        INSERT INTO guestbook (cell_id, nickname, message, visitor_ip, created_at)
        VALUES (${cid}, ${g.nick}, ${g.msg}, ${'seed.i18n.' + (count++)}, ${ts})
      `;
    }

    return res.json({ success: true, messages: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
