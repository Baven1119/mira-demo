module.exports = async function handler(req, res) {
  try {
    const prompt = req.query.prompt || 'a girl painting in a dark room, anime style, dark atmosphere';
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
    res.status(200).json({ imageUrl });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
