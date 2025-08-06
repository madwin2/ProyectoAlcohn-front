import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, RefreshCw } from 'lucide-react';

const QRDisplay = ({ qrData, onRefresh }) => {
  const [qrImage, setQrImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (qrData) {
      generateQR();
    } else {
      setQrImage(null);
      setError(null);
    }
  }, [qrData]);

  const generateQR = async () => {
    if (!qrData) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Generar QR como data URL
      const qrDataURL = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrImage(qrDataURL);
    } catch (err) {
      console.error('Error generando QR:', err);
      setError('Error generando código QR');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrImage) return;

    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `whatsapp-qr-${new Date().toISOString().slice(0, 19)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!qrData) {
    return (
      <div className="text-center py-12 text-gray-400">
        <QrCode className="w-20 h-20 mx-auto mb-4 text-gray-600" />
        <p className="text-lg font-medium mb-2">No hay código QR disponible</p>
        <p className="text-sm text-gray-500">Haz clic en "Reconectar WhatsApp" para generar uno nuevo</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-6">
          <QrCode className="w-20 h-20 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-medium">{error}</p>
        </div>
        <button
          onClick={generateQR}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <QrCode className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Código QR de WhatsApp</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateQR}
            disabled={isGenerating}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 hover:scale-105"
            title="Regenerar QR"
          >
            <RefreshCw className={`w-4 h-4 text-gray-300 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
          {qrImage && (
            <button
              onClick={downloadQR}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              title="Descargar QR"
            >
              <Download className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        {isGenerating ? (
          <div className="flex items-center justify-center w-80 h-80 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
              <p className="text-gray-300 font-medium">Generando código QR...</p>
            </div>
          </div>
        ) : qrImage ? (
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-lg shadow-2xl">
              <img
                src={qrImage}
                alt="WhatsApp QR Code"
                className="rounded-lg"
              />
            </div>
            <p className="text-sm text-gray-400 mt-4 font-medium">
              Escanea este código con WhatsApp para conectar
            </p>
          </div>
        ) : null}
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
          Instrucciones de Conexión
        </h4>
        <ol className="text-sm text-gray-300 space-y-2">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Abre WhatsApp en tu teléfono</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>Ve a <strong className="text-white">Configuración → Dispositivos Vinculados</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Toca <strong className="text-white">"Vincular un dispositivo"</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>Escanea el código QR de arriba</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
            <span>Confirma la vinculación en tu teléfono</span>
          </li>
        </ol>
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400 font-medium">
            ⚠️ El código QR expira cada 15 segundos. Si no funciona, haz clic en "Reconectar WhatsApp"
          </p>
        </div>
      </div>

      {/* Raw Data (for debugging) */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-400 hover:text-gray-300 transition-colors font-medium">
          Ver datos del QR (debug)
        </summary>
        <pre className="mt-3 p-4 bg-gray-800 rounded-lg text-xs text-gray-300 overflow-x-auto border border-gray-700">
          {qrData}
        </pre>
      </details>
    </div>
  );
};

export default QRDisplay; 