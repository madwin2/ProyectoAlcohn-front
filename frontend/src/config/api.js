// Configuración centralizada de APIs
// Cambia estas URLs según tu entorno de deploy

const config = {
  development: {
    CLIP_API_URL: 'http://188.245.218.22:8000',
    SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY
  },
  production: {
    // Servidor Hetzner con dominio y SSL
    CLIP_API_URL: 'https://detector.alcohncnc.com',
    SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY
  }
};

// Determinar el entorno
const environment = process.env.NODE_ENV || 'development';

// Exportar la configuración del entorno actual
export const apiConfig = config[environment];

// URLs específicas para facilitar el uso
export const CLIP_API_URL = apiConfig.CLIP_API_URL;
export const SUPABASE_URL = apiConfig.SUPABASE_URL;
export const SUPABASE_ANON_KEY = apiConfig.SUPABASE_ANON_KEY;

export default apiConfig; 