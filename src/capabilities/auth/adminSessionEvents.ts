/** Fired when an admin API answers 401 so the shell can re-check the session without discarding edits. */
export const ADMIN_UNAUTHORIZED_EVENT = 'lumo:admin-unauthorized';

export function notifyAdminUnauthorized(url: string, status: number): void {
  if (status !== 401 || typeof window === 'undefined' || !url.startsWith('/api/admin/')) return;
  window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
}
