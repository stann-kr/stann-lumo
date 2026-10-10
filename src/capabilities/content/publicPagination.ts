export const PUBLIC_BATCH_SIZE = 4;

export interface PublicPage<T> {
  items: T[];
  total: number;
  nextOffset: number | null;
}

export function publicPageOffset(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const offset = Number(value);
  return Number.isSafeInteger(offset) && offset >= 0 ? offset : null;
}

export async function fetchPublicPage<T>(url: string, signal: AbortSignal): Promise<PublicPage<T>> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Unable to load content');
  const result = await response.json();
  if (!result.success) throw new Error('Unable to load content');
  return result.data;
}
