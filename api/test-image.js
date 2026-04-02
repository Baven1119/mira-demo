module.exports = async function handler(req, res) {
  try {
   const prompt = req.query.prompt || 'beautiful anime girl, long straight black hair, pale skin, dark melancholic eyes, cold expression, realistic anime style, soft lighting, upper body portrait, detailed face, high quality';
    
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Key ' + process.env.FAL_KEY
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: 'square',
        num_images: 1,
        num_inference_steps: 4
      })
    });

    const data = await response.json();
    
    if(data.images && data.images[0]) {
      res.status(200).json({ imageUrl: data.images[0].url });
    } else {
      res.status(200).json({ error: 'no image', raw: data });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
