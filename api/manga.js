const STYLE_PREFIX = 'webtoon style, korean manhwa, realistic illustration, soft warm colors, detailed faces, beautiful character design, cinematic lighting, bokeh background, romance drama, professional digital art, highly detailed face, expressive eyes, soft skin texture,';

const NEGATIVE = 'black and white, sketch, rough lines, manga, anime flat, 3d, realistic photo, ugly, deformed, western comic, blurry, horror, monster, violence';

async function generateScript(dialogue) {
  const prompt = `根據以下對話，生成6格漫畫腳本。

對話內容：
${dialogue.map(function(m){ return (m.role === 'user' ? 'USER: ' : 'CHRISTINE: ') + m.content; }).join('\n')}

輸出JSON，只輸出JSON不要其他文字：
{
  "title": "這段故事的標題",
  "panels": [
    {
      "id": 1,
      "size": "large",
      "scene": "場景的英文描述，給圖像AI用，具體描述構圖、人物動作、光線、情緒，不超過30個英文單字",
      "dialogue": "台詞或null",
      "sfx": "音效字或null"
    }
  ]
}

size只能是large、medium、small其中一個。
六格的size建議：large, medium, large, small, large, medium。
場景描述要根據對話的實際內容，描述兩個角色之間發生的真實情境。
場景描述風格：webtoon韓國條漫風格，寫實細膩，暖色光影，浪漫氣氛。`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
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
      image_size: panel.size === 'small' ? 'square' : 'landscape_16_9',
      num_images: 1,
      safety_tolerance: '2'
    })
  });

  const data = await response.json();
  if(data.images && data.images[0]) {
    return Object.assign({}, panel, { imageUrl: data.images[0].url });
  }
  throw new Error('Panel ' + panel.id + ' 生成失敗');
}

module.exports = async function handler(req, res) {
  if(req.method !== 'POST') return res.status(405).end();

  try {
    const dialogue = req.body.dialogue;
    if(!dialogue || !dialogue.length) {
      return res.status(400).json({ error: '沒有對話內容' });
    }

    console.log('生成漫畫腳本...');
    const script = await generateScript(dialogue);
    console.log('腳本完成:', script.title);

    const results = [];
    for(var i = 0; i < script.panels.length; i++) {
      var panel = script.panels[i];
      console.log('生成第 ' + panel.id + ' 格...');
      var result = await generatePanel(panel);
      results.push(result);
    }

    res.status(200).json({
      success: true,
      title: script.title,
      panels: results.map(function(p) {
        return {
          id: p.id,
          size: p.size,
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
