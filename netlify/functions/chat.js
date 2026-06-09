exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { messages, system } = JSON.parse(event.body)

  const contents = []
  if (system) {
    contents.push({ role: 'user', parts: [{ text: system }] })
    contents.push({ role: 'model', parts: [{ text: 'Understood, I will follow these instructions.' }] })
  }
  messages.forEach(m => {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })
  })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 1000, temperature: 0.9 }
      })
    }
  )

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, try again.'

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ text })
  }
}