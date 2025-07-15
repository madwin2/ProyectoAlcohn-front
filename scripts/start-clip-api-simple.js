#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta fija para el directorio de CLIP API
const clipApiPath = 'C:\\Users\\julia\\Documents\\Alcohn Ai Nuevo\\ProyectoAlcohn\\Detector de Sellos';

function startClipApi() {
  if (!existsSync(clipApiPath)) {
    console.error('❌ No se pudo encontrar el directorio de CLIP API en:', clipApiPath);
    console.error('');
    console.error('💡 Asegúrate de que el directorio existe y tiene el archivo api.py');
    process.exit(1);
  }

  const apiPath = join(clipApiPath, 'api.py');
  if (!existsSync(apiPath)) {
    console.error(`❌ No se encontró api.py en: ${apiPath}`);
    process.exit(1);
  }

  console.log(`🚀 Iniciando CLIP API desde: ${clipApiPath}`);
  console.log('📝 Nota: Los warnings de Python son normales y no afectan el funcionamiento');
  console.log('');

  // Usar python -m uvicorn en lugar de uvicorn directamente
  // Esto evita el error de "Failed to find real location"
  const uvicorn = spawn('python', [
    '-m', 'uvicorn',
    'api:app',
    '--reload',
    '--host', '0.0.0.0',
    '--port', '8000',
    '--log-level', 'info'
  ], {
    cwd: clipApiPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: {
      ...process.env,
      PYTHONPATH: clipApiPath,
      PYTHONUNBUFFERED: '1',
      // Suprime algunos warnings específicos
      PYTHONWARNINGS: 'ignore::DeprecationWarning'
    }
  });

  // Filtrar y mostrar solo logs importantes
  uvicorn.stdout.on('data', (data) => {
    const output = data.toString();
    // Filtrar el warning molesto
    if (!output.includes('Failed to find real location')) {
      process.stdout.write(`[CLIP-API] ${output}`);
    }
  });

  uvicorn.stderr.on('data', (data) => {
    const output = data.toString();
    // Filtrar warnings innecesarios
    if (!output.includes('Failed to find real location') && 
        !output.includes('DeprecationWarning')) {
      process.stderr.write(`[CLIP-API] ${output}`);
    }
  });

  uvicorn.on('error', (error) => {
    console.error('❌ Error al iniciar CLIP API:', error.message);
    console.error('');
    console.error('💡 Soluciones posibles:');
    console.error('   1. Instalar uvicorn: pip install uvicorn');
    console.error('   2. Verificar Python: python --version');
    console.error('   3. Instalar dependencias: pip install -r requirements.txt');
    process.exit(1);
  });

  uvicorn.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ CLIP API se cerró con código: ${code}`);
    } else {
      console.log('✅ CLIP API cerrada correctamente');
    }
  });

  // Manejar señales de cierre
  process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando CLIP API...');
    uvicorn.kill('SIGTERM');
    setTimeout(() => {
      uvicorn.kill('SIGKILL');
    }, 5000);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando CLIP API...');
    uvicorn.kill('SIGTERM');
  });

  // Mensaje de éxito después de un delay
  setTimeout(() => {
    console.log('');
    console.log('🎉 CLIP API iniciada correctamente!');
    console.log('📍 Health check: http://localhost:8000/health');
    console.log('📖 API docs: http://localhost:8000/docs');
    console.log('');
  }, 3000);
}

startClipApi();