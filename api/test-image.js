module.exports = async function handler(req, res) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          instances: [{prompt: 'a girl painting in a dark room, anime style'}],
          parameters: {sampleCount: 1}
        })
      }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({error: e.message});
  }
}
