const STYLE_PREFIX = 'anime style illustration, japanese manga art, soft cel shading, warm color grading, detailed anime face, emotional character design, cinematic anime scene, makoto shinkai color palette, romantic atmosphere, digital painting, high quality anime art, beautiful elegant woman, long straight black hair, sharp intelligent eyes, slender figure, fitted dark blazer, subtle confident sensuality, graceful posture, sophisticated beauty,';

const NEGATIVE = 'american comic, western cartoon, photorealistic, 3d render, rough ink lines, heavy outlines, dark gritty, horror, ugly, deformed, blurry, watermark, text, bad anatomy, explicit, nsfw';

async function generateScript(dialogue) {
  const storyPrompt = `根據以下對話，先寫一段完整的漫畫故事，再切分成6格分鏡。

對話內容：
${dialogue.map(function(m){ return (m.role === 'user' ? 'USER: ' : 'CHRISTINE: ') + m.content; }).join('\n')}

第一步：寫一段完整的故事弧線，包含：
- 開場情境（在哪裡、什麼氛圍）
- 情感轉折點（發生了什麼）
- 情緒高潮（最有張力的一刻）
- 餘韻結尾（留白或暗示）

第二步：把故事切成6格分鏡，分鏡原則：
- 格1：建立場景，遠景或中景，交代環境與女主姿態
- 格2：人物反應，中景或近景，帶出情緒
- 格3：情感張力，近景或特寫，關鍵動作或眼神
- 格4：戲劇性特寫，極近景，眼神或手部細節
- 格5：情緒高潮，大格，最有衝擊力的一刻
- 格6：餘韻，中景或遠景，留白收尾

輸出JSON，只輸出JSON不要其他文字：
{
  "title": "故事標題，4-8個字",
  "story": "完整故事描述，100字左右",
  "panels": [
    {
      "id": 1,
      "size": "large",
      "shot_type": "遠景/中景/近景/特寫/極特寫",
      "scene": "英文場景描述，20-30個單字，包含：鏡頭類型、人物動作與姿態、光線、情緒氛圍",
      "dialogue": "台詞或null",
      "sfx": "音效字或null",
      "story_role": "這格在故事中的作用"
    }
  ]
}

size規則：
- 格1 large（建立場景）
- 格2 medium
- 格3 large（張力時刻）
- 格4 small（細節特寫）
- 格5 large（高潮）
- 格6 medium（收尾）

scene描述規則：
- 女主角永遠是長直黑髮、合身深色西裝的優雅女性
- 姿態要有吸引力：交叉雙腿、側身回眸、微微低頭、髮絲飄動
- 光線要打在女主身上：逆光輪廓、側光打臉、暖光從後方
- scene描述結尾統一加：anime scene, cinematic, emotional`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: storyPrompt }]
    })
  });

  const data = await response.json();
  const raw = data.content[0].text;
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}

async function generatePanel(panel) {
  const prompt = STYLE_PREFIX + panel.scene;

  const response = await fetch('https://fal.run/fal-ai/flux-pro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Key ' + process.env.FAL_KEY
    },
    body: JSON.stringify({
      prompt: prompt,
      negative_prompt: NEGATIVE,
      image_size: panel.size === 'small' ? 'square' : 'portrait_4_3',
      num_images: 1,
      safety_tolerance: '2',
      num_inference_steps: 28,
      guidance_scale: 3.5
    })
  });

  const data = await response.json();
  if(data.images && data.images[0]) {
    return Object.assign({}, panel, { imageUrl: data.images[0].url });
  }
  throw new Error('Panel ' + panel.id + ' 生成失敗: ' + JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  if(req.method !== 'POST') return res.status(405).end();

  try {
    const dialogue = req.body.dialogue;
    if(!dialogue || !dialogue.length) {
      return res.status(400).json({ error: '沒有對話內容' });
    }

    console.log('建立故事弧線...');
    const script = await generateScript(dialogue);
    console.log('故事：', script.story);
    console.log('標題：', script.title);

    const results = [];
    for(var i = 0; i < script.panels.length; i++) {
      var panel = script.panels[i];
      console.log('生成第', panel.id, '格 (' + panel.shot_type + ')...');
      var result = await generatePanel(panel);
      results.push(result);
    }

    res.status(200).json({
      success: true,
      title: script.title,
      story: script.story,
      panels: results.map(function(p) {
        return {
          id: p.id,
          size: p.size,
          shot_type: p.shot_type,
          imageUrl: p.imageUrl,
          dialogue: p.dialogue,
          sfx: p.sfx
        };
      })
    });

  } catch(e) {
    console.error('漫畫生成失敗:', e);
    res.status(500).json({ error: e.message });
  }
};
