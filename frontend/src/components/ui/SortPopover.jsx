import React, { useRef, useEffect, useState } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Trash2, GripVertical, ChevronRight } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const SortPopover = ({
  anchorRef,
  onClose,
  fields,
  sortCriteria,
  addSortCriterion,
  removeSortCriterion,
  updateSortCriterionField,
  updateSortCriterionOrder,
  moveCriterionUp,
  moveCriterionDown,
  clearSortCriteria,
  onApply,
  ordenEstadosFabricacion,
  setOrdenEstadosFabricacion,
  style = {},
}) => {
  const popoverRef = useRef();
  const [showEstados, setShowEstados] = useState(false); // colapsable

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        (!anchorRef || !anchorRef.current || !anchorRef.current.contains(e.target))
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  // Drag & drop handler
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(ordenEstadosFabricacion);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    console.log('Nuevo orden de estados:', newOrder);
    setOrdenEstadosFabricacion([...newOrder]); // Forzar nueva referencia
  };

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: '48px',
        right: 0,
        width: 540,
        background: 'rgba(9, 9, 11, 0.97)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(39, 39, 42, 0.7)',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        padding: 32,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: 'white', margin: 0 }}>Ordenar</h3>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', borderRadius: 6, padding: 4 }}
          title="Cerrar"
        >
          <X style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* Bloque colapsable de estados de fabricación */}
      <div style={{ marginBottom: 18 }}>
        <button
          onClick={() => setShowEstados((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: '#a1a1aa',
            fontWeight: 500,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            marginBottom: 6,
            padding: 0,
            userSelect: 'none',
          }}
        >
          <GripVertical style={{ width: 18, height: 18, color: '#a1a1aa' }} />
          <span>Orden de estados de fabricación</span>
          <ChevronRight style={{ width: 18, height: 18, color: '#a1a1aa', transform: showEstados ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>
        {showEstados && Array.isArray(ordenEstadosFabricacion) && ordenEstadosFabricacion.length > 0 && setOrdenEstadosFabricacion && (
          <div style={{ marginTop: 2, marginBottom: 8, border: '1px solid #23272f', borderRadius: 8, background: 'rgba(24,24,27,0.7)', padding: 8, maxWidth: 340 }}>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="estados-fabricacion-droppable">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                  >
                    {ordenEstadosFabricacion.map((estado, idx) => (
                      <Draggable key={estado} draggableId={encodeURIComponent(estado)} index={idx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              background: snapshot.isDragging ? '#23272f' : 'rgba(39,39,42,0.5)',
                              color: 'white',
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontWeight: 400,
                              fontSize: 14,
                              minHeight: 28,
                              boxShadow: snapshot.isDragging ? '0 2px 12px 0 rgba(59,130,246,0.10)' : 'none',
                              border: '1px solid #23272f',
                              transition: 'background 0.2s',
                              ...provided.draggableProps.style
                            }}
                          >
                            <GripVertical style={{ width: 14, height: 14, color: '#a1a1aa', flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>{estado}</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </div>

      {/* Divider visual */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, #23272f 60%, #18181b 100%)', margin: '18px 0 18px 0', borderRadius: 2 }} />

      {/* Criterios de ordenamiento */}
      <div style={{ marginBottom: 18 }}>
        <h4 style={{ color: 'white', fontSize: 16, margin: '0 0 10px 0', fontWeight: 600 }}>Criterios de orden</h4>
        {sortCriteria.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortCriteria.map((criterion, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                background: 'rgba(24, 24, 27, 0.7)',
                border: '1.5px solid rgba(39, 39, 42, 0.5)',
                borderRadius: 8
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#60a5fa'
                }}>{index + 1}</div>
                <select
                  value={criterion.field}
                  onChange={(e) => updateSortCriterionField(index, e.target.value)}
                  style={{
                    background: 'rgba(39, 39, 42, 0.5)',
                    border: '1px solid rgba(63, 63, 70, 0.5)',
                    color: 'white',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 15,
                    outline: 'none',
                    minWidth: 160
                  }}
                >
                  {fields.map(field => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <select
                  value={criterion.order}
                  onChange={(e) => updateSortCriterionOrder(index, e.target.value)}
                  style={{
                    background: 'rgba(39, 39, 42, 0.5)',
                    border: '1px solid rgba(63, 63, 70, 0.5)',
                    color: 'white',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 15,
                    outline: 'none',
                    minWidth: 120
                  }}
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </select>
                <button
                  onClick={() => moveCriterionUp(index)}
                  disabled={index === 0}
                  style={{
                    background: index === 0 ? 'rgba(39, 39, 42, 0.3)' : 'rgba(39, 39, 42, 0.5)',
                    border: 'none',
                    color: index === 0 ? '#71717a' : '#a1a1aa',
                    borderRadius: 4,
                    padding: 6,
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  title="Subir"
                >
                  <ChevronUp style={{ width: 14, height: 14 }} />
                </button>
                <button
                  onClick={() => moveCriterionDown(index)}
                  disabled={index === sortCriteria.length - 1}
                  style={{
                    background: index === sortCriteria.length - 1 ? 'rgba(39, 39, 42, 0.3)' : 'rgba(39, 39, 42, 0.5)',
                    border: 'none',
                    color: index === sortCriteria.length - 1 ? '#71717a' : '#a1a1aa',
                    borderRadius: 4,
                    padding: 6,
                    cursor: index === sortCriteria.length - 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  title="Bajar"
                >
                  <ChevronDown style={{ width: 14, height: 14 }} />
                </button>
                <button
                  onClick={() => removeSortCriterion(index)}
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: 'none',
                    color: '#fca5a5',
                    borderRadius: 4,
                    padding: 6,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  title="Eliminar"
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: 24,
            color: '#71717a',
            fontSize: 15
          }}>
            No hay criterios de ordenamiento configurados
          </div>
        )}
        <button
          onClick={addSortCriterion}
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            borderRadius: 8,
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 15,
            fontWeight: 500,
            transition: 'all 0.3s ease',
            width: '100%',
            justifyContent: 'center',
            marginTop: 10
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Agregar criterio de ordenamiento
        </button>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
        <button
          onClick={clearSortCriteria}
          disabled={sortCriteria.length === 0}
          style={{
            background: 'transparent',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            color: sortCriteria.length === 0 ? '#71717a' : '#a1a1aa',
            borderRadius: 8,
            padding: '10px 16px',
            cursor: sortCriteria.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: 15,
            transition: 'all 0.3s ease'
          }}
        >
          Limpiar todo
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(63, 63, 70, 0.5)',
              color: '#a1a1aa',
              borderRadius: 8,
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: 15,
              transition: 'all 0.3s ease'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onApply}
            style={{
              background: '#3b82f6',
              border: 'none',
              color: 'white',
              borderRadius: 8,
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 500,
              transition: 'all 0.3s ease'
            }}
          >
            Aplicar ordenamiento
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortPopover; 