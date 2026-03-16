import { useCallback } from 'react';

/**
 * 항목 순서 변경 로직 훅
 * 
 * 배열 항목의 순서를 변경하는 다양한 유틸리티 함수를 제공함
 * 
 * @template T - 배열 항목 타입
 * @param items - 현재 배열 데이터
 * @param setItems - 배열 업데이트 함수
 * @returns 순서 변경 핸들러 객체
 * 
 * @example
 * ```tsx
 * const { moveUp, moveDown, moveTo } = useItemReorder(tracks, setTracks);
 * 
 * // 위로 이동
 * <button onClick={() => moveUp(index)}>↑</button>
 * 
 * // 아래로 이동
 * <button onClick={() => moveDown(index)}>↓</button>
 * ```
 */
export function useItemReorder<T>(
  items: T[],
  setItems: (items: T[]) => void
) {
  /**
   * 항목을 한 칸 위로 이동
   * @param index - 이동할 항목의 현재 인덱스
   * 
   * 첫 번째 항목(index === 0)인 경우 이동하지 않음
   */
  const moveUp = useCallback((index: number) => {
    if (index <= 0) return;
    
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
  }, [items, setItems]);

  /**
   * 항목을 한 칸 아래로 이동
   * @param index - 이동할 항목의 현재 인덱스
   * 
   * 마지막 항목인 경우 이동하지 않음
   */
  const moveDown = useCallback((index: number) => {
    if (index >= items.length - 1) return;
    
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
  }, [items, setItems]);

  /**
   * 항목을 특정 위치로 이동
   * @param fromIndex - 이동할 항목의 현재 인덱스
   * @param toIndex - 이동할 목표 인덱스
   * 
   * 유효하지 않은 인덱스인 경우 이동하지 않음
   */
  const moveTo = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= items.length) return;
    
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
  }, [items, setItems]);

  /**
   * 항목을 맨 앞으로 이동
   * @param index - 이동할 항목의 현재 인덱스
   */
  const moveToFirst = useCallback((index: number) => {
    moveTo(index, 0);
  }, [moveTo]);

  /**
   * 항목을 맨 뒤로 이동
   * @param index - 이동할 항목의 현재 인덱스
   */
  const moveToLast = useCallback((index: number) => {
    moveTo(index, items.length - 1);
  }, [moveTo, items.length]);

  return {
    moveUp,
    moveDown,
    moveTo,
    moveToFirst,
    moveToLast,
  };
}