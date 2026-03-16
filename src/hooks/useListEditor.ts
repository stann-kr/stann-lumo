import { useState, useCallback, useEffect } from 'react';
import type { ListEditorReturn } from '../types/admin';

export function useListEditor<T>(initialItems: T[]): ListEditorReturn<T> & {
  setItems: (items: T[]) => void;
  editingIndex: number | null;
  startEditing: (index: number) => void;
  stopEditing: () => void;
  replaceItems: (newItems: T[]) => void;
} {
  const [items, setItems] = useState<T[]>(initialItems);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // 언어 전환 시 initialItems가 바뀌면 items도 갱신
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const addItem = useCallback((newItem: T) => {
    setItems(prev => [...prev, newItem]);
  }, []);

  const updateItem = useCallback((index: number, updatedItem: T) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? updatedItem : item
    ));
  }, []);

  const deleteItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const reorderItem = useCallback((fromIndex: number, toIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      return newItems;
    });
  }, []);

  const startEditing = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const replaceItems = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    reorderItem,
    setItems,
    editingIndex,
    startEditing,
    stopEditing,
    replaceItems,
  };
}
