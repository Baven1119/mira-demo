const STYLE_PREFIX = 'Gege Akutami manga art style, jujutsu kaisen, rough bold ink lines, high contrast black and white, dynamic composition, expressive faces, screentone shading, manga panel, masterpiece,';

const NEGATIVE = 'color, realistic, 3d, western comic, smooth lines, soft, pastel, watercolor, blurry';

const PANELS = [
  {
    id: 1,
    size: 'large',
    scene: 'two figures walking side by side on night street, woman leaning slightly toward man, street lamp golden light from above, city buildings background, long shot, silhouette style',
    dialogue: '「有時候人生需要一點衝動……」',
    sfx: null
  },
  {
    id: 2,
    size: 'medium',
    scene: 'elegant woman profile close up, eyes slightly glistening, street lamp backlight creating rim light, hair blowing in wind, emotional expression, looking into distance',
    dialogue: null,
    sfx: '——'
  },
  {
    id: 3,
    size: 'large',
    scene: 'man gently cups woman face with both hands, turning toward her, dramatic moment, strong rim light from street lamp behind, dynamic angle from below, emotional peak',
    dialogue: null,
    sfx: null
  },
  {
    id: 4,
    size: 'small',
    scene: 'ink pen falling to ground, close up, impact lines around it, ground texture detail, symbolic moment',
    dialogue: null,
    sfx: 'カタ'
  },
  {
    id: 5,
    size: 'large',
    scene: 'couple kissing under street lamp, city night skyline background, backlit silhouette, romantic atmosphere, wide shot, emotional',
    dialogue: '「就只是，我們。」',
    sfx: null
  },
  {
    id: 6,
    size: 'medium',
    scene: 'office wall with hand-drawn tree painting, small girl figure drawn beside tree looking at horizon, tiny sand grain shape beside girl, warm lamp light, symbolic and poetic',
    dialogue: '「她等了很久了。」',
    sfx: null
  }
];

async function generatePanel(panel) {
  const prompt = STYLE_PREFIX + panel.scene;

  const response = await fetch('https://fal.run/fal-ai/flux-pro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Key ' + process.env.FAL_KEY
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: NEGATIVE,
      image_size: panel.size === 'small' ? 'square' : 'landscape_16_9',
      num_images: 1,
      safety_tolerance: '2'
    })
  });

  const data = await response.json();
  if(data.images && data.images[0]) {
    return { ...panel, imageUrl: data.images[0].url };
  }
  throw new Error('Panel ' + panel.id + ' 生成失敗');
}

module.exports = async function handler(req, res) {
  if(req.method !== 'POST') return res.status(405).end();

  try {
    console.log('開始生成漫畫...');
    const results = [];
    for(const panel of PANELS) {
      console.log('生成第 ' + panel.id + ' 格...');
      const result = await generatePanel(panel);
      results.push(result);
    }

    res.status(200).json({
      success: true,
      panels: results.map(p => ({
        id: p.id,
        size: p.size,
        imageUrl: p.imageUrl,
        dialogue: p.dialogue,
        sfx: p.sfx
      }))
    });

  } catch(e) {
    console.error('漫畫生成失敗:', e);
    res.status(500).json({ error: e.message });
  }
};
