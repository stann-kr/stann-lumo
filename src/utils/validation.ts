/**
 * 문자열이 비어있는지 검증
 * @param value - 검증할 문자열
 * @returns 비어있으면 true
 */
export const isEmpty = (value: string | null | undefined): boolean => {
  return !value || value.trim().length === 0;
};

/**
 * 이메일 형식 검증
 * @param email - 검증할 이메일
 * @returns 유효하면 true
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * URL 형식 검증
 * @param url - 검증할 URL
 * @returns 유효하면 true
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 숫자 범위 검증
 * @param value - 검증할 숫자
 * @param min - 최소값
 * @param max - 최대값
 * @returns 범위 내에 있으면 true
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * 배열이 비어있는지 검증
 * @param arr - 검증할 배열
 * @returns 비어있으면 true
 */
export const isEmptyArray = <T>(arr: T[] | null | undefined): boolean => {
  return !arr || arr.length === 0;
};

/**
 * 객체가 비어있는지 검증
 * @param obj - 검증할 객체
 * @returns 비어있으면 true
 */
export const isEmptyObject = (obj: Record<string, unknown> | null | undefined): boolean => {
  return !obj || Object.keys(obj).length === 0;
};

/**
 * 문자열 길이 검증
 * @param value - 검증할 문자열
 * @param minLength - 최소 길이
 * @param maxLength - 최대 길이
 * @returns 범위 내에 있으면 true
 */
export const isValidLength = (
  value: string,
  minLength: number,
  maxLength: number
): boolean => {
  const length = value.trim().length;
  return length >= minLength && length <= maxLength;
};

/**
 * 필수 필드 검증
 * @param fields - 검증할 필드 객체
 * @returns 모든 필드가 채워져 있으면 true
 */
export const validateRequiredFields = (
  fields: Record<string, string | number | boolean | null | undefined>
): boolean => {
  return Object.values(fields).every((value) => {
    if (typeof value === 'string') {
      return !isEmpty(value);
    }
    return value !== null && value !== undefined;
  });
};