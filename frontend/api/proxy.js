export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const targetUrl = 'https://detector-sellos-r4tj-alcohns-projects.vercel.app/api';
  const endpoint = req.url.replace('/api/proxy', '');
  const url = `${targetUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: req.method === 'POST' ? req.body : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
    
  } catch (error) {
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}