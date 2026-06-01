module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageData, mediaType } = req.body;
    
    if (!imageData) return res.status(400).json({ error: 'imageData is required' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageData }
            },
            {
              type: 'text',
              text: 'あなたはSNS（ThreadsやX）投稿画像の専門評価者です。この画像を4項目で評価してください。必ずJSONのみで返答し、マークダウン記号は一切使わないこと。\n{"design":{"score":数値0-10,"reason":"評価理由（日本語1-2文）"},"comprehension":{"score":数値0-10,"reason":"評価理由（日本語1-2文）"},"interest":{"score":数値0-10,"reason":"評価理由（日本語1-2文）"},"trust":{"score":数値0-10,"reason":"評価理由（日本語1-2文）"},"improvements":["改善点1","改善点2","改善点3"],"overall_comment":"総合コメント2-3文"}\n評価基準: design=タイムラインで視線が止まるか, comprehension=1秒で内容理解できるか, interest=続きを読みたくなるか, trust=信用・共感できるか'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'API error' });
    }

    const text = data.content?.find(c => c.type === 'text')?.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);
    res.status(200).json(result);
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ error: e.message });
  }
};
