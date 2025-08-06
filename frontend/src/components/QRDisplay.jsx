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
      <div className="text-center py-8 text-gray-500">
        <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>No hay código QR disponible</p>
        <p className="text-sm">Haz clic en "Reconectar WhatsApp" para generar uno nuevo</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <QrCode className="w-16 h-16 mx-auto mb-2" />
          <p>{error}</p>
        </div>
        <button
          onClick={generateQR}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Código QR de WhatsApp</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateQR}
            disabled={isGenerating}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded"
            title="Regenerar QR"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
          {qrImage && (
            <button
              onClick={downloadQR}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded"
              title="Descargar QR"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        {isGenerating ? (
          <div className="flex items-center justify-center w-80 h-80 bg-gray-100 rounded-lg">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-gray-600">Generando código QR...</p>
            </div>
          </div>
        ) : qrImage ? (
          <div className="text-center">
            <img
              src={qrImage}
              alt="WhatsApp QR Code"
              className="border-4 border-white shadow-lg rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-2">
              Escanea este código con WhatsApp para conectar
            </p>
          </div>
        ) : null}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Instrucciones:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Abre WhatsApp en tu teléfono</li>
          <li>2. Ve a <strong>Configuración → Dispositivos Vinculados</strong></li>
          <li>3. Toca <strong>"Vincular un dispositivo"</strong></li>
          <li>4. Escanea el código QR de arriba</li>
          <li>5. Confirma la vinculación en tu teléfono</li>
        </ol>
        <p className="text-xs text-blue-700 mt-2">
          ⚠️ El código QR expira cada 15 segundos. Si no funciona, haz clic en "Reconectar WhatsApp"
        </p>
      </div>

      {/* Raw Data (for debugging) */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          Ver datos del QR (debug)
        </summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
          {qrData}
        </pre>
      </details>
    </div>
  );
};

export default QRDisplay; 