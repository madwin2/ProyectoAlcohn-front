import { useState, useCallback } from 'react';

export const useMultiSort = (initialCriteria = []) => {
  const [sortCriteria, setSortCriteria] = useState(initialCriteria);

  // Agregar un nuevo criterio de ordenamiento
  const addSortCriterion = useCallback((field, order = 'asc') => {
    setSortCriteria(prev => [...prev, { field, order }]);
  }, []);

  // Quitar un criterio por índice
  const removeSortCriterion = useCallback((index) => {
    setSortCriteria(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Cambiar el campo de un criterio
  const updateSortCriterionField = useCallback((index, field) => {
    setSortCriteria(prev => prev.map((criterion, i) => 
      i === index ? { ...criterion, field } : criterion
    ));
  }, []);

  // Cambiar la dirección de un criterio
  const updateSortCriterionOrder = useCallback((index, order) => {
    setSortCriteria(prev => prev.map((criterion, i) => 
      i === index ? { ...criterion, order } : criterion
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

  return {
    sortCriteria,
    setSortCriteria, // <-- agregar esto
    addSortCriterion,
    removeSortCriterion,
    updateSortCriterionField,
    updateSortCriterionOrder,
    moveCriterionUp,
    moveCriterionDown,
    clearSortCriteria,
    getSortCriteriaForRPC
  };
}; 