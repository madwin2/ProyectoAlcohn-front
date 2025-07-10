import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import AddPedidoModal from '../components/AddPedidoModal';
import EstadoSelect from '../components/EstadoSelect';
import {
  Plus,
  Filter,
  Search,
  X,
  Package,
  Upload
} from 'lucide-react';

const ESTADOS_FABRICACION = [
  'Sin Hacer', 'Haciendo', 'Rehacer', 'Retocar', 'Prioridad', 'Verificar', 'Hecho'
];
const ESTADOS_VENTA = [
  'Foto', 'Transferido', 'Ninguno'
];
const ESTADOS_ENVIO = [
  'Sin enviar', 'Hacer Etiqueta', 'Etiqueta Lista', 'Despachado', 'Seguimiento Enviado'
];

const initialFiltersState = {
  fecha_compra_gte: null,
  fecha_compra_lte: null,
  estado_fabricacion: [],
  estado_venta: [],
  estado_envio: [],
};

const estadosFabricacion = [
  { value: "Sin Hacer", label: "Sin Hacer", color: "slate", glow: "shadow-slate-500/20" },
  { value: "Haciendo", label: "Haciendo", color: "cyan", glow: "shadow-cyan-500/20" },
  { value: "Hecho", label: "Hecho", color: "emerald", glow: "shadow-emerald-500/20" },
  { value: "Rehacer", label: "Rehacer", color: "red", glow: "shadow-red-500/20" },
  { value: "Retocar", label: "Retocar", color: "amber", glow: "shadow-amber-500/20" },
  { value: "Prioridad", label: "Prioridad", color: "purple", glow: "shadow-purple-500/20" },
  { value: "Verificar", label: "Verificar", color: "teal", glow: "shadow-teal-500/20" },
];

const estadosVenta = [
  { value: "Ninguno", label: "Ninguno", color: "slate", glow: "shadow-slate-500/20" },
  { value: "Foto", label: "Foto", color: "blue", glow: "shadow-blue-500/20" },
  { value: "Transferido", label: "Transferido", color: "green", glow: "shadow-green-500/20" },
];

const estadosEnvio = [
  { value: "Sin enviar", label: "Sin Enviar", color: "slate", glow: "shadow-slate-500/20" },
  { value: "Hacer Etiqueta", label: "Hacer Etiqueta", color: "orange", glow: "shadow-orange-500/20" },
  { value: "Etiqueta Lista", label: "Etiqueta Lista", color: "violet", glow: "shadow-violet-500/20" },
  { value: "Despachado", label: "Despachado", color: "teal", glow: "shadow-teal-500/20" },
  { value: "Seguimiento Enviado", label: "Seguimiento Enviado", color: "green", glow: "shadow-green-500/20" },
];

const getInclusiveEndDateISOString = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  const endOfDay = new Date(year, month - 1, day);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.toISOString();
};

const getSignedUrl = async (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) {
    const idx = filePath.indexOf('/archivos-ventas/');
    if (idx !== -1) {
      filePath = filePath.substring(idx + '/archivos-ventas/'.length);
    }
  }
  const { data, error } = await supabase.storage
    .from('archivos-ventas')
    .createSignedUrl(filePath, 60);
  if (error) {
    alert('No se pudo generar el enlace de acceso al archivo');
    return null;
  }
  return data.signedUrl;
};

function ProduccionPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const getPedidos = async () => {
      try {
        setLoading(true);
        setError(null);
        let query = supabase.from('pedidos').select('*');
        query = query.order('fecha_compra', { ascending: sortOrder === 'asc' });
        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        setPedidos(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getPedidos();
  }, [sortOrder]);

  const handlePedidoAdded = () => {
    setIsModalOpen(false);
    // Refrescar pedidos
    setLoading(true);
    supabase.from('pedidos').select('*').then(({ data }) => {
      setPedidos(data || []);
      setLoading(false);
    });
  };

  const handleEstadoChange = async (pedido, campo, valor) => {
    try {
      const pedidoFields = {
        p_id: pedido.id_pedido,
        p_estado_fabricacion: campo === 'estado_fabricacion' ? valor : pedido.estado_fabricacion,
        p_estado_venta: campo === 'estado_venta' ? valor : pedido.estado_venta,
        p_estado_envio: campo === 'estado_envio' ? valor : pedido.estado_envio,
      };
      await supabase.rpc('editar_pedido', pedidoFields);
      // Refrescar pedidos
      const { data } = await supabase.from('pedidos').select('*');
      setPedidos(data || []);
    } catch (err) {
      alert('Error al actualizar el estado');
    }
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: 'white' }}>
      <div style={{ borderBottom: '1px solid rgba(39, 39, 42, 0.5)', background: 'rgba(9, 9, 11, 0.8)', position: 'sticky', top: 0, zIndex: 10, padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package style={{ width: '20px', height: '20px', color: 'black' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '300', letterSpacing: '-0.025em', margin: 0 }}>
                  Producción
                </h1>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0 0' }}>
                  {pedidos.length} activos
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{ background: 'white', color: 'black', border: 'none', fontWeight: '500', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'background 0.3s ease' }}
            onMouseEnter={e => e.target.style.background = '#e5e7eb'}
            onMouseLeave={e => e.target.style.background = 'white'}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Nuevo
          </button>
        </div>
      </div>
      <AddPedidoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPedidoAdded={handlePedidoAdded} />
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '32px' }}>
        <div className="table-container" style={{ background: 'rgba(9, 9, 11, 0.5)', border: '1px solid rgba(39, 39, 42, 0.5)', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(39, 39, 42, 0.5)' }}>
                  <th style={{ color: '#a1a1aa', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', padding: '16px 12px', verticalAlign: 'middle' }}>Fecha</th>
                  <th style={{ color: '#a1a1aa', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', padding: '16px 12px', verticalAlign: 'middle' }}>Diseño</th>
                  <th style={{ color: '#a1a1aa', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', padding: '16px 12px', verticalAlign: 'middle' }}>Medida</th>
                  <th style={{ color: '#a1a1aa', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', padding: '16px 12px', verticalAlign: 'middle' }}>Notas</th>
                  <th style={{ color: '#a1a1aa', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', padding: '16px 12px', verticalAlign: 'middle' }}>Estado</th>
                  <th style={{ color: '#a1a1aa', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', padding: '16px 12px', verticalAlign: 'middle', minWidth: '220px' }}>Base</th>
                  <th style={{ color: '#a1a1aa', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', padding: '16px 12px', verticalAlign: 'middle' }}>Vector</th>
                  <th style={{ color: '#a1a1aa', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', padding: '16px 12px', verticalAlign: 'middle' }}>F Sello</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#71717a', padding: '32px' }}>Cargando...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#ef4444', padding: '32px' }}>Error: {error}</td>
                  </tr>
                ) : pedidos.length > 0 ? (
                  pedidos.map((pedido) => (
                    <tr key={pedido.id_pedido} style={{ borderBottom: '1px solid rgba(39, 39, 42, 0.3)', cursor: 'pointer', transition: 'background 0.3s ease' }}>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{ color: '#a1a1aa', fontSize: '13px' }}>{pedido.fecha_compra ? new Date(pedido.fecha_compra).toLocaleDateString() : '-'}</span>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div>
                          <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>{pedido.disenio || "Sin especificar"}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div>
                          <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>{pedido.medida_pedida || "Sin medida"}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div>
                          <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>{pedido.notas || "Sin notas"}</span>
                        </div>
                      </td>
                      <td style={{ minWidth: '220px', padding: '16px 12px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <EstadoSelect
                            value={pedido.estado_fabricacion}
                            onChange={val => handleEstadoChange(pedido, 'estado_fabricacion', val)}
                            options={ESTADOS_FABRICACION}
                            type="fabricacion"
                            isDisabled={false}
                            size="small"
                            style={{ width: '75%' }}
                          />
                          <div style={{ display: 'flex', width: '100%' }}>
                            <EstadoSelect
                              value={pedido.estado_venta}
                              onChange={val => handleEstadoChange(pedido, 'estado_venta', val)}
                              options={ESTADOS_VENTA}
                              type="venta"
                              isDisabled={pedido.estado_fabricacion !== "Hecho"}
                              size="small"
                              style={{ width: '50%' }}
                            />
                            <EstadoSelect
                              value={pedido.estado_envio}
                              onChange={val => handleEstadoChange(pedido, 'estado_envio', val)}
                              options={ESTADOS_ENVIO}
                              type="envio"
                              isDisabled={pedido.estado_venta !== "Transferido"}
                              size="small"
                              style={{ width: '50%' }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <ArchivoCell
                          filePath={pedido.archivo_base}
                          nombre="Archivo Base"
                          pedidoId={pedido.id_pedido}
                          field="archivo_base"
                        />
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <ArchivoCell
                          filePath={pedido.archivo_vector}
                          nombre="Archivo Vector"
                          pedidoId={pedido.id_pedido}
                          field="archivo_vector"
                        />
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <ArchivoCell
                          filePath={pedido.foto_sello}
                          nombre="Foto Sello"
                          pedidoId={pedido.id_pedido}
                          field="foto_sello"
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#71717a', padding: '32px' }}>No se encontraron pedidos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para gestión de archivos estilo estetica.txt
function ArchivoCell({ filePath, nombre, pedidoId, field, onUpload, onDelete, editing }) {
  const [signedUrl, setSignedUrl] = React.useState(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    if (!filePath) return;
    let mounted = true;
    getSignedUrl(filePath).then(url => { if (mounted) setSignedUrl(url); });
    return () => { mounted = false; };
  }, [filePath]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${field}_${pedidoId}_${timestamp}.${fileExtension}`;
      const { data, error } = await supabase.storage
        .from('archivos-ventas')
        .upload(fileName, file);
      if (error) throw error;
      const { data: publicData } = supabase.storage
        .from('archivos-ventas')
        .getPublicUrl(fileName);
      const updateData = {};
      updateData[`p_${field}`] = publicData.publicUrl;
      await supabase.rpc('editar_pedido', {
        p_id: pedidoId,
        ...updateData
      });
      if (onUpload) onUpload();
    } catch (err) {
      alert('Error al subir el archivo: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!signedUrl) return;
    try {
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('No se pudo descargar el archivo');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar ${nombre}?`)) {
      onDelete && onDelete(signedUrl || filePath, field, pedidoId);
    }
  };

  if (!filePath) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <label style={{
          color: '#a1a1aa',
          background: 'transparent',
          border: '1px solid rgba(63, 63, 70, 0.5)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.3s ease'
        }}
          onMouseEnter={(e) => {
            e.target.style.color = 'white';
            e.target.style.background = 'rgba(39, 39, 42, 0.5)';
            e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#a1a1aa';
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)';
          }}
        >
          <Upload style={{ width: '12px', height: '12px' }} />
          {field === 'foto_sello' ? 'Foto' : 'Subir'}
          <input
            type="file"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={isUploading}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </label>
      </div>
    );
  }

  if (!signedUrl) return <span style={{ color: '#71717a', fontSize: '12px' }}>Cargando...</span>;

  const isImage = filePath.match(/\.(jpg|jpeg|png|gif|svg)$/i);

  if (isImage) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '48px', width: '48px' }}>
        <div
          style={{
            position: 'relative',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <a href={signedUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={signedUrl}
              alt={nombre}
              style={{
                width: '48px',
                height: '48px',
                objectFit: 'cover',
                borderRadius: '6px',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                transition: 'border-color 0.3s ease'
              }}
            />
          </a>
          {isHovered && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <button
                onClick={handleDownload}
                style={{
                  color: 'white',
                  fontSize: '10px',
                  background: 'rgba(39, 39, 42, 0.8)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                Ver
              </button>
              <button
                onClick={handleDelete}
                style={{
                  color: '#ef4444',
                  fontSize: '10px',
                  background: 'rgba(39, 39, 42, 0.8)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                X
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => window.open(signedUrl, '_blank')}
        style={{
          color: '#a1a1aa',
          background: 'transparent',
          border: '1px solid rgba(63, 63, 70, 0.5)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.color = 'white';
          e.target.style.background = 'rgba(39, 39, 42, 0.5)';
          e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = '#a1a1aa';
          e.target.style.background = 'transparent';
          e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)';
        }}
      >
        <Upload style={{ width: '12px', height: '12px' }} />
        {field === 'foto_sello' ? 'Foto' : 'Ver'}
      </button>
    </div>
  );
}

export default ProduccionPage; 