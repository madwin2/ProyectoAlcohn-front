#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const { existsSync } = require('fs');

const execAsync = promisify(exec);
// Try multiple possible paths for the CLIP API
const possiblePaths = [
  '/mnt/c/Users/julia/Documents/Alcohn Ai Nuevo/ProyectoAlcohn/Detector de Sellos',
  '/mnt/c/Users/julia/Documents/Detector de Sellos'
];

let clipApiPath = null;
for (const path of possiblePaths) {
  if (existsSync(path)) {
    clipApiPath = path;
    break;
  }
}

async function killExistingProcesses() {
  console.log('🔍 Buscando procesos uvicorn existentes...');
  
  try {
    // Kill any existing uvicorn processes
    if (process.platform === 'win32') {
      await execAsync('taskkill /F /IM python.exe /FI "WINDOWTITLE eq *uvicorn*" 2>nul || echo No uvicorn processes found');
      await execAsync('netstat -ano | findstr :8000 | for /f "tokens=5" %a in (\'more\') do taskkill /F /PID %a 2>nul || echo Port 8000 not in use');
    } else {
      await execAsync('pkill -f "uvicorn.*api:app" || echo "No uvicorn processes found"');
      await execAsync('lsof -ti:8000 | xargs kill -9 || echo "Port 8000 not in use"');
    }
    
    console.log('✅ Procesos existentes terminados');
  } catch (error) {
    console.log('ℹ️  No hay procesos previos que terminar');
  }
  
  // Wait a moment for processes to fully terminate
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function startClipApi() {
  console.log('🚀 Reiniciando CLIP API con configuración CORS actualizada...');
  
  await killExistingProcesses();
  
  console.log(`📍 Directorio: ${clipApiPath}`);
  console.log('🔧 Iniciando uvicorn con CORS habilitado...');
  console.log('');
  
  if (!clipApiPath) {
    console.error('❌ No se pudo encontrar el directorio de CLIP API en ninguna de las ubicaciones:');
    possiblePaths.forEach(path => console.error(`  - ${path}`));
    process.exit(1);
  }

  const uvicorn = spawn('python3', [
    '-m', 'uvicorn',
    'api:app',
    '--reload',
    '--host', '0.0.0.0',
    '--port', '8000',
    '--log-level', 'info'
  ], {
    cwd: clipApiPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      PYTHONPATH: clipApiPath,
      PYTHONUNBUFFERED: '1'
    }
  });

  uvicorn.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(`[CLIP-API] ${output}`);
    
    // Check if server started successfully
    if (output.includes('Uvicorn running on')) {
      setTimeout(async () => {
        console.log('');
        console.log('🎉 CLIP API reiniciada correctamente!');
        console.log('🔗 Health check: http://localhost:8000/health');
        console.log('📖 API docs: http://localhost:8000/docs');
        console.log('🌐 CORS: Configurado para permitir todos los orígenes');
        console.log('');
        
        // Test the API
        try {
          const response = await fetch('http://localhost:8000/health');
          if (response.ok) {
            console.log('✅ Health check exitoso - API funcionando');
          }
        } catch (error) {
          console.log('⚠️  Health check falló - API puede estar iniciando');
        }
      }, 2000);
    }
  });

  uvicorn.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('Failed to find real location')) {
      process.stderr.write(`[CLIP-API] ${output}`);
    }
  });

  uvicorn.on('error', (error) => {
    console.error('❌ Error al iniciar CLIP API:', error.message);
    process.exit(1);
  });

  uvicorn.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ CLIP API se cerró con código: ${code}`);
    } else {
      console.log('✅ CLIP API cerrada correctamente');
    }
  });

  // Handle shutdown
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
}

startClipApi().catch(error => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});