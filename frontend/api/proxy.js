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
    // Get raw body for FormData
    let body = undefined;
    if (req.method === 'POST') {
      body = req.body;
    }

    const fetchOptions = {
      method: req.method,
      body: body
    };

    // Don't set content-type for FormData, let browser handle it
    if (req.headers['content-type'] && !req.headers['content-type'].includes('multipart/form-data')) {
      fetchOptions.headers = {
        'Content-Type': req.headers['content-type']
      };
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.text();
    
    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.send(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}