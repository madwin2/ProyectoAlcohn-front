import React, { useState, useEffect } from 'react';
import { FileText, Filter, ChevronDown, ChevronUp, Clock, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const SystemLogs = ({ logs, loading, onLoadLogs }) => {
  const [filterLevel, setFilterLevel] = useState('');
  const [limit, setLimit] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    onLoadLogs(limit, filterLevel || null);
  }, [limit, filterLevel, onLoadLogs]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warn':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case 'error':
        return 'Error';
      case 'warn':
        return 'Advertencia';
      case 'info':
        return 'Información';
      default:
        return level;
    }
  };

  const handleFilterChange = (newLevel) => {
    setFilterLevel(newLevel === filterLevel ? '' : newLevel);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-3 rounded border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Logs del Sistema
        </h2>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de Log
              </label>
              <div className="flex gap-2">
                {['error', 'warn', 'info'].map(level => (
                  <button
                    key={level}
                    onClick={() => handleFilterChange(level)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      filterLevel === level
                        ? getLevelColor(level)
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {getLevelIcon(level)}
                    <span className="ml-1">{getLevelText(level)}</span>
                  </button>
                ))}
                {filterLevel && (
                  <button
                    onClick={() => setFilterLevel('')}
                    className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300 rounded-full hover:bg-gray-200"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={25}>25 logs</option>
                <option value={50}>50 logs</option>
                <option value={100}>100 logs</option>
                <option value={200}>200 logs</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No hay logs disponibles</p>
          <p className="text-sm">
            {filterLevel ? `No hay logs de nivel "${getLevelText(filterLevel)}"` : 'El sistema no ha generado logs aún'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className={`p-3 rounded-lg border ${getLevelColor(log.level)}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getLevelIcon(log.level)}
                    <span className="font-medium">{log.message}</span>
                  </div>
                  
                  {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer hover:underline">
                        Ver detalles
                      </summary>
                      <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-xs opacity-70 ml-4">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(log.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Información:</strong> Los logs se actualizan automáticamente. 
          Usa los filtros para ver logs específicos por nivel de importancia.
        </p>
      </div>
    </div>
  );
};

export default SystemLogs; 