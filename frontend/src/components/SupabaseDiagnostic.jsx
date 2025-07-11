import React, { useState } from 'react';
import { setupSupabaseStorage, checkSupabaseSetup } from '../utils/supabaseSetup';
import { fileUploadService } from '../services/fileUploadService';

/**
 * Componente para diagnosticar y configurar Supabase Storage
 */
function SupabaseDiagnostic() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isSetup, setIsSetup] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      addLog('🔍 Iniciando diagnóstico de Supabase...', 'info');
      
      // Verificar configuración actual
      const currentSetup = await checkSupabaseSetup();
      if (currentSetup) {
        addLog('✅ Configuración actual detectada', 'success');
        setIsSetup(true);
      } else {
        addLog('⚠️  Configuración no encontrada', 'warning');
        setIsSetup(false);
      }
      
      // Ejecutar configuración completa
      addLog('🔧 Ejecutando configuración completa...', 'info');
      const result = await setupSupabaseStorage();
      
      if (result.success) {
        addLog('🎉 Configuración completada exitosamente', 'success');
        setIsSetup(true);
      } else {
        addLog(`❌ Error: ${result.error}`, 'error');
        setIsSetup(false);
      }
      
    } catch (error) {
      addLog(`❌ Error en diagnóstico: ${error.message}`, 'error');
      setIsSetup(false);
    } finally {
      setIsRunning(false);
    }
  };

  const testFileUpload = async () => {
    setIsRunning(true);
    
    try {
      addLog('🧪 Probando subida de archivo...', 'info');
      
      // Crear archivo de prueba
      const testContent = 'Este es un archivo de prueba para verificar la funcionalidad de subida';
      const testFile = new Blob([testContent], { type: 'text/plain' });
      testFile.name = 'test_upload.txt';
      
      // Probar subida
      const result = await fileUploadService.uploadFile(testFile, 'archivo_base', 'test_123');
      
      if (result.publicUrl) {
        addLog(`✅ Subida exitosa: ${result.fileName}`, 'success');
        
        // Probar eliminación
        addLog('🗑️ Probando eliminación...', 'info');
        await fileUploadService.deleteFile(result.publicUrl);
        addLog('✅ Eliminación exitosa', 'success');
      }
      
    } catch (error) {
      addLog(`❌ Error en prueba: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '80vh',
      background: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '16px',
      zIndex: 1000,
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3 style={{ color: '#f9fafb', margin: '0 0 16px 0' }}>
        Diagnóstico Supabase Storage
      </h3>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#9ca3af' }}>Estado:</span>
          <span style={{ 
            color: isSetup === true ? '#10b981' : isSetup === false ? '#ef4444' : '#6b7280',
            fontWeight: 'bold'
          }}>
            {isSetup === true ? 'Configurado' : isSetup === false ? 'No configurado' : 'Desconocido'}
          </span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={runDiagnostic}
          disabled={isRunning}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.5 : 1,
            fontSize: '11px'
          }}
        >
          {isRunning ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
        </button>
        
        <button
          onClick={testFileUpload}
          disabled={isRunning || !isSetup}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: (isRunning || !isSetup) ? 'not-allowed' : 'pointer',
            opacity: (isRunning || !isSetup) ? 0.5 : 1,
            fontSize: '11px'
          }}
        >
          Probar Subida
        </button>
      </div>
      
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        background: '#111827',
        padding: '12px',
        borderRadius: '4px',
        border: '1px solid #374151'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
            No hay logs disponibles
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '4px',
              color: getLogColor(log.type)
            }}>
              <span style={{ color: '#6b7280' }}>[{log.timestamp}] </span>
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SupabaseDiagnostic;