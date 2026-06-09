exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { messages, system } = JSON.parse(event.body)

    const groqMessages = []
    if (system) {
      groqMessages.push({ role: 'system', content: system })
    }
    messages.forEach(m => {
      groqMessages.push({ role: m.role, content: m.content })
    })

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          max_tokens: 1000,
          temperature: 0.9
        })
      }
    )

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ text: 'ERROR: ' + JSON.stringify(data) })
      }
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ text })
    }
  } catch(e) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ text: 'CATCH ERROR: ' + e.message })
    }
  }
}
