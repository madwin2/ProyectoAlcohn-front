import React, { useRef, useState, useEffect } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const SortModal = ({ 
  isOpen, 
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
  setOrdenEstadosFabricacion
}) => {
  if (!isOpen) return null;

  // --- POP OVER DRAG & DROP ---
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef();
  const buttonRef = useRef();

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    if (!popoverOpen) return;
    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  // Drag & drop handler
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(ordenEstadosFabricacion);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    setOrdenEstadosFabricacion(newOrder);
  };

  const handleAddCriterion = () => {
    if (fields.length > 0) {
      addSortCriterion(fields[0].value, 'asc');
    }
  };

  const handleApply = () => {
    onApply();
    onClose();
  };

  // Función para mover un estado hacia arriba o abajo
  const moverEstado = (index, direccion) => {
    setOrdenEstadosFabricacion(prev => {
      const nuevoOrden = [...prev];
      const newIndex = index + direccion;
      if (newIndex < 0 || newIndex >= nuevoOrden.length) return nuevoOrden;
      [nuevoOrden[index], nuevoOrden[newIndex]] = [nuevoOrden[newIndex], nuevoOrden[index]];
      return nuevoOrden;
    });
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0, 0, 0, 0.8)', 
      backdropFilter: 'blur(8px)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 50 
    }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '100%', 
        margin: '0 16px', 
        background: 'rgba(9, 9, 11, 0.98)', 
        backdropFilter: 'blur(24px)', 
        border: '1px solid rgba(39, 39, 42, 0.5)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', 
        borderRadius: '12px',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid rgba(39, 39, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'white', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <ChevronUp style={{ width: '20px', height: '20px', color: 'black' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '300', letterSpacing: '-0.025em', color: 'white' }}>
                Ordenar Tabla
              </div>
              <div style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '400' }}>
                Configura el orden de los resultados
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(39, 39, 42, 0.5)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#a1a1aa';
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          padding: '24px', 
          maxHeight: 'calc(90vh - 140px)', 
          overflowY: 'auto' 
        }}>
          {/* Botón para abrir popover drag & drop */}
          {Array.isArray(ordenEstadosFabricacion) && ordenEstadosFabricacion.length > 0 && setOrdenEstadosFabricacion && (
            <div style={{ marginBottom: 24, position: 'relative' }}>
              <button
                ref={buttonRef}
                onClick={() => setPopoverOpen(v => !v)}
                style={{
                  background: '#18181b',
                  color: 'white',
                  border: '1px solid #27272a',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: popoverOpen ? '0 4px 24px 0 rgba(59,130,246,0.15)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <GripVertical style={{ width: 18, height: 18, color: '#a1a1aa' }} />
                Orden de estados de fabricación
              </button>
              {popoverOpen && (
                <div
                  ref={popoverRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45)',
                    padding: 20,
                    minWidth: 260,
                    zIndex: 100,
                    animation: 'fadeIn 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h4 style={{ color: 'white', margin: 0, fontWeight: 500, fontSize: 16 }}>Ordenar Estados</h4>
                    <button
                      onClick={() => setPopoverOpen(false)}
                      style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', borderRadius: 6, padding: 4 }}
                      title="Cerrar"
                    >
                      <X style={{ width: 18, height: 18 }} />
                    </button>
                  </div>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable
                      droppableId="estados-fabricacion-droppable"
                      renderClone={(provided, snapshot, rubric) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: '#27272a',
                            color: 'white',
                            borderRadius: 6,
                            padding: '8px 12px',
                            fontWeight: 400,
                            fontSize: 15,
                            boxShadow: '0 2px 12px 0 rgba(59,130,246,0.15)',
                            border: '1px solid #27272a',
                            transition: 'background 0.2s',
                            ...provided.draggableProps.style
                          }}
                        >
                          <GripVertical style={{ width: 16, height: 16, color: '#a1a1aa', flexShrink: 0 }} />
                          <span style={{ flex: 1 }}>{ordenEstadosFabricacion[rubric.source.index]}</span>
                        </div>
                      )}
                    >
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
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
                                    gap: 10,
                                    background: snapshot.isDragging ? '#27272a' : 'rgba(39,39,42,0.7)',
                                    color: 'white',
                                    borderRadius: 6,
                                    padding: '8px 12px',
                                    fontWeight: 400,
                                    fontSize: 15,
                                    boxShadow: snapshot.isDragging ? '0 2px 12px 0 rgba(59,130,246,0.15)' : 'none',
                                    border: '1px solid #27272a',
                                    transition: 'background 0.2s',
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  <GripVertical style={{ width: 16, height: 16, color: '#a1a1aa', flexShrink: 0 }} />
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
          )}

          {/* Criterios existentes */}
          {sortCriteria.length > 0 ? (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'white', fontSize: '16px', margin: '0 0 16px 0' }}>
                Criterios de ordenamiento ({sortCriteria.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortCriteria.map((criterion, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'rgba(24, 24, 27, 0.5)',
                    border: '1px solid rgba(39, 39, 42, 0.5)',
                    borderRadius: '8px'
                  }}>
                    {/* Número de prioridad */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#60a5fa'
                    }}>
                      {index + 1}
                    </div>

                    {/* Campo */}
                    <select
                      value={criterion.field}
                      onChange={(e) => updateSortCriterionField(index, e.target.value)}
                      style={{
                        background: 'rgba(39, 39, 42, 0.5)',
                        border: '1px solid rgba(63, 63, 70, 0.5)',
                        color: 'white',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        outline: 'none',
                        minWidth: '140px'
                      }}
                    >
                      {fields.map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>

                    {/* Dirección */}
                    <select
                      value={criterion.order}
                      onChange={(e) => updateSortCriterionOrder(index, e.target.value)}
                      style={{
                        background: 'rgba(39, 39, 42, 0.5)',
                        border: '1px solid rgba(63, 63, 70, 0.5)',
                        color: 'white',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        outline: 'none',
                        minWidth: '100px'
                      }}
                    >
                      <option value="asc">Ascendente</option>
                      <option value="desc">Descendente</option>
                    </select>

                    {/* Botones de control */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => moveCriterionUp(index)}
                        disabled={index === 0}
                        style={{
                          background: index === 0 ? 'rgba(39, 39, 42, 0.3)' : 'rgba(39, 39, 42, 0.5)',
                          border: 'none',
                          color: index === 0 ? '#71717a' : '#a1a1aa',
                          borderRadius: '4px',
                          padding: '6px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (index !== 0) {
                            e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                            e.target.style.color = '#60a5fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (index !== 0) {
                            e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                            e.target.style.color = '#a1a1aa';
                          }
                        }}
                      >
                        <ChevronUp style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={() => moveCriterionDown(index)}
                        disabled={index === sortCriteria.length - 1}
                        style={{
                          background: index === sortCriteria.length - 1 ? 'rgba(39, 39, 42, 0.3)' : 'rgba(39, 39, 42, 0.5)',
                          border: 'none',
                          color: index === sortCriteria.length - 1 ? '#71717a' : '#a1a1aa',
                          borderRadius: '4px',
                          padding: '6px',
                          cursor: index === sortCriteria.length - 1 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (index !== sortCriteria.length - 1) {
                            e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                            e.target.style.color = '#60a5fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (index !== sortCriteria.length - 1) {
                            e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                            e.target.style.color = '#a1a1aa';
                          }
                        }}
                      >
                        <ChevronDown style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={() => removeSortCriterion(index)}
                        style={{
                          background: 'rgba(220, 38, 38, 0.1)',
                          border: 'none',
                          color: '#fca5a5',
                          borderRadius: '4px',
                          padding: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(220, 38, 38, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(220, 38, 38, 0.1)';
                        }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: '#71717a',
              fontSize: '14px'
            }}>
              No hay criterios de ordenamiento configurados
            </div>
          )}

          {/* Botón agregar criterio */}
          <button
            onClick={handleAddCriterion}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              borderRadius: '8px',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              width: '100%',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.2)';
              e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.1)';
              e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Agregar criterio de ordenamiento
          </button>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '24px', 
          borderTop: '1px solid rgba(39, 39, 42, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={clearSortCriteria}
            disabled={sortCriteria.length === 0}
            style={{
              background: 'transparent',
              border: '1px solid rgba(63, 63, 70, 0.5)',
              color: sortCriteria.length === 0 ? '#71717a' : '#a1a1aa',
              borderRadius: '8px',
              padding: '10px 16px',
              cursor: sortCriteria.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (sortCriteria.length > 0) {
                e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (sortCriteria.length > 0) {
                e.target.style.background = 'transparent';
                e.target.style.color = '#a1a1aa';
              }
            }}
          >
            Limpiar todo
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                color: '#a1a1aa',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(39, 39, 42, 0.5)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#a1a1aa';
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              style={{
                background: '#3b82f6',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#3b82f6';
              }}
            >
              Aplicar ordenamiento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortModal; 