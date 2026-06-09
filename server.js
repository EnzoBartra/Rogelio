const http = require('http');
const fs   = require('fs');
const path = require('path');

// Load .env manually (no extra dependencies needed)
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    .split('\n')
    .forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    });
} catch(e) {}

const PORT = 3000;

http.createServer(async (req, res) => {

  // ── Serve index.html ──────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }

  // ── POST /api/chat ────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { messages, system } = JSON.parse(body);

        const groqMessages = [];
        if (system) groqMessages.push({ role: 'system', content: system });
        messages.forEach(m => groqMessages.push({ role: m.role, content: m.content }));

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        });

        const data = await groqRes.json();
        const text = data.choices?.[0]?.message?.content;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: text || 'ERROR: ' + JSON.stringify(data) }));

      } catch(e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: 'CATCH ERROR: ' + e.message }));
      }
    });
    return;
  }

  // ── 404 ───────────────────────────────────────────────────────
  res.writeHead(404);
  res.end('Not found');

}).listen(PORT, () => {
  console.log(`Rogelio corriendo en http://localhost:${PORT}`);
});
