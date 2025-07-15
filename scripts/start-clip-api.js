#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Rutas posibles para el directorio de CLIP API
const possiblePaths = [
  join(__dirname, '../../../Alcohn Ai Nuevo/ProyectoAlcohn/Detector de Sellos'),
  join(__dirname, '../../Alcohn Ai Nuevo/ProyectoAlcohn/Detector de Sellos'),
  'C:\\Users\\julia\\Documents\\Alcohn Ai Nuevo\\ProyectoAlcohn\\Detector de Sellos'
];

function findClipApiPath() {
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
}

function startClipApi() {
  const clipApiPath = findClipApiPath();
  
  if (!clipApiPath) {
    console.error('❌ No se pudo encontrar el directorio de CLIP API');
    console.error('   Rutas buscadas:');
    possiblePaths.forEach(path => console.error(`   - ${path}`));
    console.error('');
    console.error('💡 Asegúrate de que el directorio "Detector de Sellos" exista');
    process.exit(1);
  }

  console.log(`🚀 Iniciando CLIP API desde: ${clipApiPath}`);
  
  // Verificar que api.py existe
  const apiPath = join(clipApiPath, 'api.py');
  if (!existsSync(apiPath)) {
    console.error(`❌ No se encontró api.py en: ${apiPath}`);
    process.exit(1);
  }

  // Iniciar uvicorn con configuración mejorada para Windows
  const uvicorn = spawn('python', [
    '-m', 'uvicorn',
    'api:app',
    '--reload',
    '--host', '0.0.0.0',
    '--port', '8000',
    '--reload-delay', '1'
  ], {
    cwd: clipApiPath,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PYTHONPATH: clipApiPath,
      // Suprime algunos warnings de uvicorn en Windows
      PYTHONUNBUFFERED: '1'
    }
  });

  uvicorn.on('error', (error) => {
    console.error('❌ Error al iniciar CLIP API:', error.message);
    console.error('');
    console.error('💡 Asegúrate de tener uvicorn instalado:');
    console.error('   pip install uvicorn');
    process.exit(1);
  });

  uvicorn.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ CLIP API se cerró con código: ${code}`);
    }
  });

  // Manejar señales de cierre
  process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando CLIP API...');
    uvicorn.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando CLIP API...');
    uvicorn.kill('SIGTERM');
  });
}

startClipApi();