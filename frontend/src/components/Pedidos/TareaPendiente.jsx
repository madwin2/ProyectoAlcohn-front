import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Check, Trash2 } from 'lucide-react';
import './TareaPendiente.css';

const GRAVITY = 0.5;
const FRICTION = 0.96;
const BOUNCE = 0.85;
const MAX_VELOCITY = 16;
const BALL_SIZE = 44;

const TareaPendiente = ({ 
  tarea, 
  onUpdatePosition, 
  onComplete, 
  onDelete, 
  containerWidth, 
  containerHeight 
}) => {
  const elementRef = useRef(null);
  const popoverRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: Math.max(0, Math.min(containerWidth - BALL_SIZE, parseFloat(tarea.posicion_x) || 0)),
    y: Math.max(0, Math.min(containerHeight - BALL_SIZE, parseFloat(tarea.posicion_y) || 0))
  });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0, t: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  // Física: gravedad, rebote, throw
  const applyPhysics = useCallback(() => {
    if (isDragging || !containerWidth || !containerHeight) return;
    setVelocity(prev => {
      let newVx = prev.x * FRICTION;
      let newVy = prev.y * FRICTION + GRAVITY;
      newVx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVx));
      newVy = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVy));
      return { x: newVx, y: newVy };
    });
    setPosition(prev => {
      let newX = prev.x + velocity.x;
      let newY = prev.y + velocity.y;
      // Rebote horizontal
      if (newX <= 0) {
        newX = 0;
        setVelocity(v => ({ ...v, x: -v.x * BOUNCE }));
      } else if (newX >= containerWidth - BALL_SIZE) {
        newX = containerWidth - BALL_SIZE;
        setVelocity(v => ({ ...v, x: -v.x * BOUNCE }));
      }
      // Rebote vertical
      if (newY <= 0) {
        newY = 0;
        setVelocity(v => ({ ...v, y: -v.y * BOUNCE }));
      } else if (newY >= containerHeight - BALL_SIZE) {
        newY = containerHeight - BALL_SIZE;
        setVelocity(v => ({ ...v, y: -v.y * BOUNCE }));
      }
      return { x: newX, y: newY };
    });
  }, [isDragging, containerWidth, containerHeight, velocity]);

  // Animación
  useEffect(() => {
    if (!isAnimating) return;
    const animationFrame = requestAnimationFrame(() => {
      applyPhysics();
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [applyPhysics, isAnimating]);

  // Iniciar/parar animación
  useEffect(() => {
    if (!isDragging && !isAnimating) setIsAnimating(true);
    else if (isDragging && isAnimating) setIsAnimating(false);
  }, [isDragging, isAnimating]);

  // Arrastre con efecto throw
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setIsAnimating(false);
    setVelocity({ x: 0, y: 0 });
    setLastMouse({ x: e.clientX, y: e.clientY, t: Date.now() });
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !elementRef.current) return;
    const container = elementRef.current.parentElement;
    const containerRect = container.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - BALL_SIZE / 2;
    const newY = e.clientY - containerRect.top - BALL_SIZE / 2;
    // Limitar dentro del contenedor
    const clampedX = Math.max(0, Math.min(containerWidth - BALL_SIZE, newX));
    const clampedY = Math.max(0, Math.min(containerHeight - BALL_SIZE, newY));
    setPosition({ x: clampedX, y: clampedY });
    setLastMouse({ x: e.clientX, y: e.clientY, t: Date.now() });
  }, [isDragging, containerWidth, containerHeight]);

  const handleMouseUp = useCallback((e) => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
      // Efecto throw: calcula velocidad del mouse
      const now = Date.now();
      const dt = Math.max(1, now - lastMouse.t);
      const vx = (e.clientX - lastMouse.x) / dt * 16; // 16ms ~ 1 frame
      const vy = (e.clientY - lastMouse.y) / dt * 16;
      setVelocity({ x: vx, y: vy });
      // Guardar posición en la base de datos
      onUpdatePosition(tarea.id_tarea, position.x, position.y);
    }
  }, [isDragging, onUpdatePosition, tarea.id_tarea, position, lastMouse]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Popover: click para mostrar/ocultar
  const handleTogglePopover = useCallback((e) => {
    e.stopPropagation();
    setShowPopover(prev => !prev);
  }, []);

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    if (!showPopover) return;
    
    const handleClickOutside = (e) => {
      // Verificar si el click fue fuera del elemento y del popover
      const isOutsideElement = elementRef.current && !elementRef.current.contains(e.target);
      const isOutsidePopover = popoverRef.current && !popoverRef.current.contains(e.target);
      
      if (isOutsideElement && isOutsidePopover) {
        setShowPopover(false);
      }
    };

    // Usar un pequeño delay para evitar que se cierre inmediatamente al hacer click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  // Acciones
  const handleComplete = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await onComplete(tarea.id_tarea);
    setShowPopover(false);
  }, [onComplete, tarea.id_tarea]);

  const handleDelete = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      await onDelete(tarea.id_tarea);
      setShowPopover(false);
    }
  }, [onDelete, tarea.id_tarea]);

  return (
    <div
      ref={elementRef}
      className={`tarea-pendiente${isDragging ? ' dragging' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: BALL_SIZE,
        height: BALL_SIZE,
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        zIndex: isDragging ? 100 : 10,
        userSelect: 'none',
        background: 'linear-gradient(135deg, #232a3b 60%, #3b82f6 100%)',
        borderRadius: '50%',
        boxShadow: isDragging
          ? '0 0 16px 4px #3b82f6cc, 0 2px 8px #0008'
          : '0 2px 8px 0 #3b82f655, 0 1px 4px #0006',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleTogglePopover}
      tabIndex={0}
    >
      <span className="tarea-emoji-simple">📝</span>
      {showPopover && (
        <div 
          ref={popoverRef}
          className="tarea-tooltip-simple"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tooltip-header-simple">
            <span className="tooltip-title-simple">Tarea</span>
            <div className="tooltip-actions-simple">
              <button 
                className="tooltip-btn-simple complete-btn"
                onClick={handleComplete}
                title="Completar tarea"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Check size={13} />
              </button>
              <button 
                className="tooltip-btn-simple delete-btn"
                onClick={handleDelete}
                title="Eliminar tarea"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          <div className="tooltip-content-simple">
            <span className="tooltip-description-simple">{tarea.descripcion}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TareaPendiente; 