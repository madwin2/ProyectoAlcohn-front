const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const port = 3001;

// Configurar multer para manejar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint proxy para vectorizer.ai
app.post('/api/vectorize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó imagen' });
    }

    // Crear FormData para vectorizer.ai
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname || 'image.jpg',
      contentType: req.file.mimetype || 'image/jpeg'
    });
    formData.append('mode', 'production');
    formData.append('processing.max_colors', '256');
    formData.append('output_format', 'svg');

    // Llamar a vectorizer.ai API
    const response = await fetch('https://api.vectorizer.ai/api/v1/vectorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic dmtreXZ2Zm4zdm04cHZhOmpjcmw5ajQ1NjVtY2FsdDR0Mm1xdWFmNHVrOGVuNGhydDBwZG90ZGNpbHY3ZTU4NXJlYzg=',
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de vectorizer.ai:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Error de vectorizer.ai: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const svgContent = await response.text();
    
    // Devolver el SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgContent);

  } catch (error) {
    console.error('Error en el proxy de vectorización:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor proxy funcionando' });
});

app.listen(port, () => {
  console.log(`Servidor proxy corriendo en http://localhost:${port}`);
});