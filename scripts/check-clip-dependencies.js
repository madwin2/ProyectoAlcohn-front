#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const clipApiPath = 'C:\\Users\\julia\\Documents\\Alcohn Ai Nuevo\\ProyectoAlcohn\\Detector de Sellos';

async function checkPythonDependencies() {
  console.log('🔍 Verificando dependencias de Python para CLIP API...\n');
  
  // Verificar que el directorio existe
  if (!existsSync(clipApiPath)) {
    console.error('❌ Directorio de CLIP API no encontrado:', clipApiPath);
    return false;
  }
  
  // Verificar requirements.txt
  const requirementsPath = join(clipApiPath, 'requirements.txt');
  if (!existsSync(requirementsPath)) {
    console.error('❌ No se encontró requirements.txt en:', requirementsPath);
    return false;
  }
  
  console.log('✅ Directorio de CLIP API encontrado');
  console.log('✅ requirements.txt encontrado');
  
  // Verificar Python
  try {
    await runCommand('python', ['--version']);
    console.log('✅ Python disponible');
  } catch (error) {
    console.error('❌ Python no está instalado o no está en PATH');
    return false;
  }
  
  // Verificar pip
  try {
    await runCommand('pip', ['--version']);
    console.log('✅ pip disponible');
  } catch (error) {
    console.error('❌ pip no está instalado o no está en PATH');
    return false;
  }
  
  // Verificar uvicorn
  try {
    await runCommand('uvicorn', ['--version']);
    console.log('✅ uvicorn disponible');
  } catch (error) {
    console.log('⚠️  uvicorn no encontrado, intentando instalar...');
    try {
      await runCommand('pip', ['install', 'uvicorn']);
      console.log('✅ uvicorn instalado');
    } catch (installError) {
      console.error('❌ Error instalando uvicorn:', installError.message);
      return false;
    }
  }
  
  // Verificar dependencias principales
  const mainDeps = ['torch', 'clip-by-openai', 'fastapi', 'pillow'];
  
  for (const dep of mainDeps) {
    try {
      await runCommand('python', ['-c', `import ${dep.replace('-', '_').replace('_by_openai', '')}`]);
      console.log(`✅ ${dep} disponible`);
    } catch (error) {
      console.log(`⚠️  ${dep} no encontrado, puede necesitar instalación`);
    }
  }
  
  console.log('\n💡 Si hay dependencias faltantes, ejecuta:');
  console.log(`   cd "${clipApiPath}"`);
  console.log('   pip install -r requirements.txt');
  
  return true;
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true 
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || `Command failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

checkPythonDependencies()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Verificación completada!');
      process.exit(0);
    } else {
      console.log('\n❌ Verificación falló');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Error durante la verificación:', error.message);
    process.exit(1);
  });