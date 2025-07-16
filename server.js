const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Configuración de Pixian API
const PIXIAN_API_ID = 'pxekaq6i395qgge';
const PIXIAN_API_SECRET = 'v7a4o7opqln6il8btfepch3bcro9igmvme4dfnvte348mnm6l5qm';
const PIXIAN_AUTH = 'Basic cHhla2FxNmkzOTVxZ2dlOnY3YTRvN29wcWxuNmlsOGJ0ZmVwY2gzYmNybzlpZ212bWU0ZGZudnRlMzQ4bW5tNmw1cW0=';

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
    formData.append('processing.max_colors', '2'); // Solo 2 colores: negro y transparente
    formData.append('processing.color_precision', '0'); // Máxima precisión de color
    formData.append('processing.color_quantization', 'median_cut'); // Algoritmo de cuantización
    formData.append('processing.white_threshold', '0.95'); // Umbral para considerar blanco como transparente
    formData.append('processing.transparent_color', 'white'); // Tratar blanco como transparente
    formData.append('processing.color_replacement', 'black'); // Reemplazar todos los colores no blancos con negro
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

// Endpoint proxy para Pixian (remoción de fondo)
app.post('/api/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó imagen' });
    }

    console.log('Procesando remoción de fondo con Pixian...');

    // Crear FormData para Pixian API
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname || 'image.jpg',
      contentType: req.file.mimetype || 'image/jpeg'
    });

    // Llamar a Pixian API
    const response = await fetch('https://api.pixian.ai/api/v2/remove-background', {
      method: 'POST',
      headers: {
        'Authorization': PIXIAN_AUTH,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de Pixian API:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Error de Pixian API: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    // Obtener la imagen sin fondo
    const imageBuffer = await response.buffer();
    
    // Devolver la imagen sin fondo
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error en el proxy de remoción de fondo:', error);
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