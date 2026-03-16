/**
 * localStorage에서 데이터를 안전하게 가져옴
 * @param key - localStorage 키
 * @param defaultValue - 기본값
 * @returns 파싱된 데이터 또는 기본값
 */
export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`localStorage 읽기 실패 (key: ${key}):`, error);
    return defaultValue;
  }
};

/**
 * localStorage에 데이터를 안전하게 저장
 * @param key - localStorage 키
 * @param value - 저장할 데이터
 * @returns 성공 여부
 */
export const setLocalStorage = <T>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`localStorage 저장 실패 (key: ${key}):`, error);
    return false;
  }
};

/**
 * localStorage에서 데이터를 안전하게 제거
 * @param key - localStorage 키
 * @returns 성공 여부
 */
export const removeLocalStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`localStorage 삭제 실패 (key: ${key}):`, error);
    return false;
  }
};

/**
 * localStorage 전체 초기화
 * @returns 성공 여부
 */
export const clearLocalStorage = (): boolean => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('localStorage 초기화 실패:', error);
    return false;
  }
};