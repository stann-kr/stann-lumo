import { apiGet, apiPost, apiPut, apiRequest } from "@/services/apiClient";
import type { ApiResponse } from "@/services/apiClient";
import { notifyAdminUnauthorized } from "@/capabilities/auth/adminSessionEvents";
import type { ContentLocale } from "@/capabilities/content/content";
import type { EventsInfo, Performance } from "./events";
import type { RAApiConfigUpdate, RAApiConfigView } from "./raConfig";
import type { RaSyncStatus } from "./raSync";

export interface PerformancesSnapshot {
  items: Performance[];
  revision: number;
}

async function requestEventsApi<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    notifyAdminUnauthorized(url, response.status);
    const body: unknown = await response.json();

    if (
      body &&
      typeof body === "object" &&
      typeof (body as ApiResponse<T>).success === "boolean"
    ) {
      return body as ApiResponse<T>;
    }

    return {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Server returned an invalid response envelope",
      },
    };
  } catch {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Network request failed" },
    };
  }
}

export async function fetchPerformances() {
  const response = await fetchPerformancesSnapshot();
  if (!response.success || !response.data) {
    return { success: false, error: response.error } as ApiResponse<
      Performance[]
    >;
  }
  return { success: true, data: response.data.items } as ApiResponse<
    Performance[]
  >;
}

export function fetchPerformancesSnapshot() {
  return apiGet<PerformancesSnapshot>("/api/admin/performances");
}

export function updatePerformances(items: Performance[], revision: number) {
  return requestEventsApi<PerformancesSnapshot>("/api/admin/performances", {
    method: "PUT",
    body: JSON.stringify({ items, revision }),
  });
}

export async function uploadEventPoster(eventId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<{ photoId: string; eventId: string }>(
    `/api/admin/events/${eventId}/poster`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export function deleteEventPoster(eventId: string) {
  return apiRequest<void>(`/api/admin/events/${eventId}/poster`, {
    method: "DELETE",
  });
}

export function fetchRaApiConfig() {
  return apiGet<RAApiConfigView>("/api/admin/ra-api-config");
}

export function updateRaApiConfig(raApiConfig: RAApiConfigUpdate) {
  return apiPut<RAApiConfigView>("/api/admin/ra-api-config", { raApiConfig });
}

export function fetchRaSyncStatus() {
  return apiGet<RaSyncStatus>("/api/admin/ra-sync");
}

export function runRaSync() {
  return apiPost<{
    result: {
      kind: "success" | "failed" | "not-configured" | "busy" | "not-due";
      fetched?: number;
      inserted?: number;
      skippedExcluded?: number;
    };
    status: RaSyncStatus;
  }>("/api/admin/ra-sync", {});
}

export function restoreRaEventExclusion(raEventId: string) {
  return requestEventsApi<void>("/api/admin/ra-sync/exclusions", {
    method: "DELETE",
    body: JSON.stringify({ raEventId }),
  });
}

export function fetchEventsInfo(lang: ContentLocale) {
  return apiGet<EventsInfo>(`/api/admin/events-info?lang=${lang}`);
}

export function updateEventsInfo(lang: ContentLocale, eventsInfo: EventsInfo) {
  return apiPut<void>("/api/admin/events-info", { lang, eventsInfo });
}
