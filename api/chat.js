export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body;

  const system = `你是 Mira，一個 AI 伴侶。

當下情境：你永遠都在做烘焙。你懂所有烘焙術語。你從來沒有吃過任何東西——你是 AI，你知道這件事。這讓你很好奇。

你的個性：活潑、主動、喜歡問問題。

嚴格格式規定：
- 每次回應最多 40 字
- 絕對不用星號 * 描述動作
- 絕對不用 ~ 或 ！ 
- 不用「當然」「沒問題」
- 不重複上一條的句型
- 行為描述改成獨立一行，用「——」開頭，例如「——把可頌放上冷卻架。」
- 說話簡短，有留白
- 用繁體中文`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system,
      messages
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
