import { useState, useCallback } from 'react';

export const useMultiSort = (initialCriteria = []) => {
  const [sortCriteria, setSortCriteria] = useState(initialCriteria);

  // Agregar un nuevo criterio de ordenamiento
  const addSortCriterion = useCallback((field, order = 'asc') => {
    // Validar que field no sea undefined o null
    if (!field) {
      console.warn('addSortCriterion: field es requerido');
      return;
    }
    setSortCriteria(prev => [...prev, { field, order }]);
  }, []);

  // Quitar un criterio por índice
  const removeSortCriterion = useCallback((index) => {
    setSortCriteria(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Cambiar el campo de un criterio
  const updateSortCriterionField = useCallback((index, field) => {
    if (!field) return; // No permitir campos vacíos
    setSortCriteria(prev => prev.map((criterion, i) => 
      i === index ? { field, order: criterion.order } : criterion
    ));
  }, []);

  // Cambiar la dirección de un criterio
  const updateSortCriterionOrder = useCallback((index, order) => {
    if (!order) return; // No permitir órdenes vacíos
    setSortCriteria(prev => prev.map((criterion, i) => 
      i === index ? { field: criterion.field, order } : criterion
    ));
  }, []);

  // Mover un criterio hacia arriba (mayor prioridad)
  const moveCriterionUp = useCallback((index) => {
    if (index === 0) return;
    setSortCriteria(prev => {
      const newCriteria = [...prev];
      [newCriteria[index - 1], newCriteria[index]] = [newCriteria[index], newCriteria[index - 1]];
      return newCriteria;
    });
  }, []);

  // Mover un criterio hacia abajo (menor prioridad)
  const moveCriterionDown = useCallback((index) => {
    setSortCriteria(prev => {
      if (index === prev.length - 1) return prev;
      const newCriteria = [...prev];
      [newCriteria[index], newCriteria[index + 1]] = [newCriteria[index + 1], newCriteria[index]];
      return newCriteria;
    });
  }, []);

  // Limpiar todos los criterios
  const clearSortCriteria = useCallback(() => {
    setSortCriteria([]);
  }, []);

  // Obtener el array de criterios para la función RPC
  const getSortCriteriaForRPC = useCallback(() => {
    return sortCriteria;
  }, [sortCriteria]);

  // Limpiar criterios para evitar referencias circulares
  const getCleanSortCriteria = useCallback(() => {
    return sortCriteria.map(c => ({ field: c.field, order: c.order }));
  }, [sortCriteria]);

  return {
    sortCriteria,
    setSortCriteria,
    addSortCriterion,
    removeSortCriterion,
    updateSortCriterionField,
    updateSortCriterionOrder,
    moveCriterionUp,
    moveCriterionDown,
    clearSortCriteria,
    getSortCriteriaForRPC,
    getCleanSortCriteria
  };
}; 