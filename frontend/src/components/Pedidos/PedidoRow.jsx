import React, { useState, useEffect, useRef } from 'react';
import { TableRow, TableCell } from '../ui/Table';
import ArchivoCell from '../ArchivoCell';
import EstadoSelect from '../EstadoSelect';
import TareaPendiente from './TareaPendiente';
import AddTareaModal from './AddTareaModal';
import { Plus } from 'lucide-react';

const PedidoRow = ({ 
  pedido, 
  editing, 
  editForm, 
  handleEditFormChange, 
  handleEditRowRightClick, 
  handleRowRightClick, 
  startEdit, 
  getEstadoStyle: _getEstadoStyle, 
  handlePedidoAdded, 
  handleEliminarArchivo, 
  supabase, 
  getPedidos, 
  ESTADOS_FABRICACION, 
  ESTADOS_VENTA, 
  ESTADOS_ENVIO, 
  setEditForm, 
  editingId: _editingId,
  tareasPendientes = [],
  onCreateTarea,
  onUpdateTareaPosition,
  onCompleteTarea,
  onDeleteTarea
}) => {
  // Estilo invisible para inputs
  const invisibleInput = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'inherit',
    font: 'inherit',
    width: '100%',
    padding: 0,
    margin: 0,
    boxShadow: 'none',
    appearance: 'none',
    minWidth: 0,
    fontSize: 'inherit',
    fontWeight: 'inherit',
  };

  // Función para actualizar un campo de estado en la base de datos
  const handleEstadoChange = async (campo, valor) => {
    try {
      const pedidoFields = {
        p_id: pedido.id_pedido,
        p_estado_fabricacion: campo === 'estado_fabricacion' ? valor : pedido.estado_fabricacion,
        p_estado_venta: campo === 'estado_venta' ? valor : pedido.estado_venta,
        p_estado_envio: campo === 'estado_envio' ? valor : pedido.estado_envio,
      };
      await supabase.rpc('editar_pedido', pedidoFields);
      getPedidos();
    } catch {
      alert('Error al actualizar el estado');
    }
  };

  console.log('Estados en PedidoRow:', ESTADOS_FABRICACION);

  // Estado para el modal de agregar tarea
  const [showAddTareaModal, setShowAddTareaModal] = useState(false);
  const [tareasDelPedido, setTareasDelPedido] = useState([]);
  const rowRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Permitir que el menú contextual pueda abrir el modal
  React.useImperativeHandle(pedido.addTareaModalRef, () => ({
    open: () => setShowAddTareaModal(true),
    close: () => setShowAddTareaModal(false)
  }), []);

  // Filtrar tareas del pedido actual
  useEffect(() => {
    const tareasFiltradas = tareasPendientes.filter(tarea => tarea.id_pedido === pedido.id_pedido);
    setTareasDelPedido(tareasFiltradas);
  }, [tareasPendientes, pedido.id_pedido]);

  // Obtener dimensiones del contenedor
  useEffect(() => {
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      setContainerDimensions({
        width: rect.width,
        height: rect.height
      });
    }
  }, []);

  // Manejar agregar tarea
  const handleAddTarea = async (pedidoId, descripcion) => {
    if (onCreateTarea) {
      await onCreateTarea(pedidoId, descripcion);
    }
  };

  // Manejar actualizar posición de tarea
  const handleUpdateTareaPosition = async (tareaId, posX, posY) => {
    if (onUpdateTareaPosition) {
      await onUpdateTareaPosition(tareaId, posX, posY);
    }
  };

  // Manejar completar tarea
  const handleCompleteTarea = async (tareaId) => {
    if (onCompleteTarea) {
      await onCompleteTarea(tareaId);
    }
  };

  // Manejar eliminar tarea
  const handleDeleteTarea = async (tareaId) => {
    if (onDeleteTarea) {
      await onDeleteTarea(tareaId);
    }
  };

  return (
    <TableRow
      ref={rowRef}
      editing={editing}
      onContextMenu={editing ? handleEditRowRightClick : (e) => handleRowRightClick(e, pedido.id_pedido)}
      onDoubleClick={e => {
        if (!editing) {
          e.preventDefault();
          e.stopPropagation();
          startEdit(pedido);
        }
      }}
      style={{ position: 'relative' }}
    >
      {/* Fecha */}
      <TableCell>
        {editing ? (
          <input
            name="fecha_compra"
            type="date"
            value={editForm.fecha_compra}
            onChange={handleEditFormChange}
            style={invisibleInput}
            autoFocus
          />
        ) : (
          <span style={{ color: '#a1a1aa', fontSize: '13px' }}>
            {pedido.fecha_compra || '-'}
          </span>
        )}
      </TableCell>

      {/* Nombre/Apellido */}
      <TableCell style={{ minWidth: '120px' }}>
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '2px'
        }}>
          {editing ? (
            <>
              <input
                name="nombre_cliente"
                value={editForm.nombre_cliente}
                onChange={handleEditFormChange}
                style={{ ...invisibleInput, color: 'white', fontWeight: 500, fontSize: '15px' }}
                placeholder="Nombre"
              />
              <input
                name="apellido_cliente"
                value={editForm.apellido_cliente}
                onChange={handleEditFormChange}
                style={{ ...invisibleInput, color: '#71717a', fontWeight: 400, fontSize: '13px' }}
                placeholder="Apellido"
              />
            </>
          ) : (
            <>
              <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', display: 'block' }}>
                {pedido.clientes?.nombre_cliente || 'N/A'}
              </span>
              <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', display: 'block' }}>
                {pedido.clientes?.apellido_cliente || ''}
              </span>
            </>
          )}
        </div>
      </TableCell>

      {/* Diseño y notas */}
      <TableCell>
        {editing ? (
          <>
            <input
              name="disenio"
              value={editForm.disenio}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: 'white', fontWeight: 500, fontSize: '15px', marginBottom: 0, display: 'block' }}
              placeholder="Diseño"
            />
            <input
              name="medida_pedida"
              value={editForm.medida_pedida || ''}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: '#71717a', fontWeight: 400, fontSize: '13px', marginBottom: 0, display: 'block' }}
              placeholder="Medida"
            />
            <input
              name="notas"
              value={editForm.notas}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: '#71717a', fontWeight: 400, fontSize: '13px', marginBottom: 0, display: 'block' }}
              placeholder="Notas"
            />
          </>
        ) : (
          <div>
            <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>
              {pedido.disenio || "Sin especificar"}
            </span>
            <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', margin: 0, display: 'block' }}>
              {(pedido.medida_pedida || "Sin medida") + " - " + (pedido.notas || "Sin notas")}
            </span>
          </div>
        )}
      </TableCell>

      {/* Contacto */}
      <TableCell>
        {editing ? (
          <>
            <input
              name="medio_contacto"
              value={editForm.medio_contacto}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: 'white', fontWeight: 500, fontSize: '15px', marginBottom: 0, display: 'block' }}
              placeholder="Medio"
            />
            <input
              name="telefono_cliente"
              value={editForm.telefono_cliente}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: '#71717a', fontWeight: 400, fontSize: '13px', marginBottom: 0, display: 'block' }}
              placeholder="Teléfono"
            />
          </>
        ) : (
          <div>
            <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>
              {pedido.clientes?.medio_contacto || 'N/A'}
            </span>
            <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', margin: 0, display: 'block' }}>
              {pedido.clientes?.telefono_cliente || 'N/A'}
            </span>
          </div>
        )}
      </TableCell>

      {/* Seña/Envío */}
      <TableCell>
        {editing ? (
          <>
            <input
              name="valor_senia"
              type="number"
              value={editForm.valor_senia}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: 'white', fontWeight: 500, fontSize: '15px', marginBottom: 0, display: 'block' }}
              placeholder="Seña"
            />
            <input
              name="valor_envio"
              type="number"
              value={editForm.valor_envio}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: '#71717a', fontWeight: 400, fontSize: '13px', marginBottom: 0, display: 'block' }}
              placeholder="Envío"
            />
          </>
        ) : (
          <div>
            <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>
              Seña: ${pedido.valor_senia?.toLocaleString() || 0}
            </span>
            <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', margin: 0, display: 'block' }}>
              Envío: ${pedido.valor_envio?.toLocaleString() || 0}
            </span>
          </div>
        )}
      </TableCell>

      {/* Valor y resto */}
      <TableCell>
        {editing ? (
          <>
            <input
              name="valor_sello"
              type="number"
              value={editForm.valor_sello}
              onChange={handleEditFormChange}
              style={{ ...invisibleInput, color: 'white', fontWeight: 500, fontSize: '15px', marginBottom: 0, display: 'block' }}
              placeholder="Valor"
            />
            <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', display: 'block', margin: 0 }}>
              Resta: ${(Number(editForm.valor_sello || 0) - Number(editForm.valor_senia || 0)).toLocaleString()}
            </span>
          </>
        ) : (
          <div>
            <span style={{ color: 'white', fontWeight: 500, fontSize: '15px', margin: 0, display: 'block' }}>
              ${pedido.valor_sello?.toLocaleString()}
            </span>
            <span style={{ color: '#71717a', fontWeight: 400, fontSize: '13px', display: 'block', margin: 0 }}>
              Resta: ${pedido.restante_pagar?.toLocaleString()}
            </span>
          </div>
        )}
      </TableCell>

      {/* Estado */}
      <TableCell style={{ minWidth: '220px' }} verticalAlign="middle">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <EstadoSelect
            value={editing ? editForm.estado_fabricacion : pedido.estado_fabricacion}
            onChange={val => editing ? setEditForm(prev => ({ ...prev, estado_fabricacion: val })) : handleEstadoChange('estado_fabricacion', val)}
            options={ESTADOS_FABRICACION}
            type="fabricacion"
            isDisabled={false}
            size="small"
            style={{ width: '75%' }}
          />
          <div style={{ display: 'flex', width: '100%' }}>
            <EstadoSelect
              value={editing ? editForm.estado_venta : pedido.estado_venta}
              onChange={val => editing ? setEditForm(prev => ({ ...prev, estado_venta: val })) : handleEstadoChange('estado_venta', val)}
              options={ESTADOS_VENTA}
              type="venta"
              isDisabled={editing ? false : pedido.estado_fabricacion !== "Hecho"}
              size="small"
              style={{ width: '50%' }}
            />
            <EstadoSelect
              value={editing ? editForm.estado_envio : pedido.estado_envio}
              onChange={val => editing ? setEditForm(prev => ({ ...prev, estado_envio: val })) : handleEstadoChange('estado_envio', val)}
              options={ESTADOS_ENVIO}
              type="envio"
              isDisabled={editing ? false : pedido.estado_venta !== "Transferido"}
              size="small"
              style={{ width: '50%' }}
            />
          </div>
        </div>
      </TableCell>

      {/* Base */}
      <TableCell align="center" verticalAlign="middle">
        <ArchivoCell
          filePath={editing ? editForm.archivo_base : pedido.archivo_base}
          nombre="Archivo Base"
          pedidoId={pedido.id_pedido}
          field="archivo_base"
          onUpload={handlePedidoAdded}
          onDelete={handleEliminarArchivo}
          editing={editing}
        />
      </TableCell>

      {/* Vector */}
      <TableCell align="center" verticalAlign="middle">
        <ArchivoCell
          filePath={editing ? editForm.archivo_vector : pedido.archivo_vector}
          nombre="Archivo Vector"
          pedidoId={pedido.id_pedido}
          field="archivo_vector"
          onUpload={handlePedidoAdded}
          onDelete={handleEliminarArchivo}
          editing={editing}
        />
      </TableCell>

      {/* Foto Sello */}
      <TableCell align="center" verticalAlign="middle">
        <ArchivoCell
          filePath={editing ? editForm.foto_sello : pedido.foto_sello}
          nombre="Foto Sello"
          pedidoId={pedido.id_pedido}
          field="foto_sello"
          onUpload={handlePedidoAdded}
          onDelete={handleEliminarArchivo}
          editing={editing}
        />
      </TableCell>

      {/* Seguimiento */}
      <TableCell>
        {editing ? (
          <input
            name="numero_seguimiento"
            value={editForm.numero_seguimiento}
            onChange={handleEditFormChange}
            style={{ ...invisibleInput, fontFamily: 'monospace', color: 'white', fontSize: '13px' }}
            placeholder="Seguimiento"
          />
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '13px', color: pedido.numero_seguimiento ? '#d4d4d8' : '#71717a', fontStyle: pedido.numero_seguimiento ? 'normal' : 'italic' }}>
            {pedido.numero_seguimiento || 'Sin asignar'}
          </div>
        )}
      </TableCell>

      {/* Contenedor de tareas pendientes */}
      <div className="tareas-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        {tareasDelPedido.map((tarea) => (
          <TareaPendiente
            key={tarea.id_tarea}
            tarea={tarea}
            onUpdatePosition={handleUpdateTareaPosition}
            onComplete={handleCompleteTarea}
            onDelete={handleDeleteTarea}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
          />
        ))}
      </div>

      {/* Modal para agregar tarea */}
      <AddTareaModal
        isOpen={showAddTareaModal}
        onClose={() => setShowAddTareaModal(false)}
        pedido={pedido}
        onCreateTarea={handleAddTarea}
      />
    </TableRow>
  );
};

export default PedidoRow;