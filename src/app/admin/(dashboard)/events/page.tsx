"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useContent } from "@/contexts/ContentContext";
import AdminCard from "@/components/base/AdminCard";
import AdminSectionHeader from "@/components/base/AdminSectionHeader";
import DeleteConfirmModal from "@/components/base/DeleteConfirmModal";
import FormInput from "@/components/base/FormInput";
import FormSelect from "@/components/base/FormSelect";
import SaveErrorMessage from "@/components/base/SaveErrorMessage";
import SuccessMessage from "@/components/base/SuccessMessage";
import { useDeleteConfirm } from "@/capabilities/admin/useDeleteConfirm";
import { useListEditor } from "@/capabilities/admin/useListEditor";
import { useSaveNotification } from "@/capabilities/admin/useSaveNotification";
import { useAdminEditGuard } from "@/capabilities/admin/AdminEditGuard";
import { updatePageMeta as apiUpdatePageMeta } from "@/capabilities/content/contentAdmin.client";
import type { PageMeta } from "@/capabilities/content/content";
import type { Performance } from "@/capabilities/events/events";
import type {
  RAApiConfigUpdate,
  RAApiConfigView,
} from "@/capabilities/events/raConfig";
import type { RaSyncStatus } from "@/capabilities/events/raSync";
import RaSyncPanel from "@/capabilities/events/RaSyncPanel";
import { sortEventsByDate } from "@/capabilities/events/raApi.client";
import {
  deleteEventPoster,
  fetchPerformancesSnapshot,
  fetchRaApiConfig,
  fetchRaSyncStatus,
  restoreRaEventExclusion,
  runRaSync,
  updatePerformances,
  updateRaApiConfig,
  uploadEventPoster,
} from "@/capabilities/events/eventsAdmin.client";
import EventEditor from "@/capabilities/events/EventEditor";
import { MAX_UPLOAD_BYTES, POSTER_UPLOAD_TYPES } from "@/capabilities/media/media";
import collection from "@/capabilities/admin/AdminCollection.module.css";
import { createBorderFaint } from "@/utils/colorMix";

const EMPTY_CONFIG: RAApiConfigView = {
  userId: "",
  djId: "",
  option: "1",
  year: "",
  hasApiKey: false,
};
const EMPTY_PERFORMANCES: Performance[] = [];

function normalize(items: Performance[]) {
  return sortEventsByDate(
    items.map((item) => ({
      ...item,
      status: (item.status === ("Confirmed" as string)
        ? "Announced"
        : item.status === ("Pending" as string)
          ? "TBA"
          : item.status) as Performance["status"],
    })),
    false,
  );
}

export default function AdminEventsPage() {
  const { t } = useTranslation();
  const { allContent, currentEditLanguage, isLoading, updateContent } =
    useContent();
  const {
    items: performances,
    setItems,
    updateItem,
    deleteItem,
  } = useListEditor<Performance>(EMPTY_PERFORMANCES);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [posterSuccess, setPosterSuccess] = useState("");
  const [savedItems, setSavedItems] = useState<Performance[]>([]);
  const [revision, setRevision] = useState<number | null>(null);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [pageMeta, setPageMeta] = useState<PageMeta>(
    allContent[currentEditLanguage].pageMeta,
  );
  const [isPageMetaDirty, setIsPageMetaDirty] = useState(false);
  const [pageMetaLanguage, setPageMetaLanguage] = useState(currentEditLanguage);
  const [config, setConfig] = useState<RAApiConfigView>(EMPTY_CONFIG);
  const [replacementKey, setReplacementKey] = useState("");
  const [clearKey, setClearKey] = useState(false);
  const [isConfigDirty, setIsConfigDirty] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [configFailed, setConfigFailed] = useState(false);
  const [syncStatus, setSyncStatus] = useState<RaSyncStatus | null>(null);
  const [isSyncStatusLoading, setIsSyncStatusLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [posterBusy, setPosterBusy] = useState<Record<string, boolean>>({});
  const [posterError, setPosterError] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncSuccess, setSyncSuccess] = useState("");
  const [hasConflict, setHasConflict] = useState(false);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();
  const { setDirty } = useAdminEditGuard();
  const deleteConfirm = useDeleteConfirm();
  const isPosterBusy = Object.values(posterBusy).some(Boolean);
  const hasEventEdits = useMemo(
    () => JSON.stringify(performances) !== JSON.stringify(savedItems),
    [performances, savedItems],
  );
  const hasUnsavedChanges = hasEventEdits || isPageMetaDirty || isConfigDirty;

  useEffect(() => {
    setDirty(hasUnsavedChanges);
  }, [hasUnsavedChanges, setDirty]);

  useEffect(() => () => setDirty(false), [setDirty]);

  const applySnapshot = useCallback(
    (items: Performance[], nextRevision: number) => {
      const nextItems = normalize(items);
      setItems(nextItems);
      setSavedItems(nextItems);
      setRevision(nextRevision);
      setHasConflict(false);
    },
    [setItems],
  );

  const loadEvents = useCallback(async () => {
    setIsEventsLoading(true);
    try {
      const response = await fetchPerformancesSnapshot();
      if (!response.success || !response.data) throw new Error("snapshot");
      applySnapshot(response.data.items, response.data.revision);
      return true;
    } catch {
      setSaveError(
        "이벤트 목록을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.",
      );
      return false;
    } finally {
      setIsEventsLoading(false);
    }
  }, [applySnapshot]);

  const loadSyncStatus = useCallback(async () => {
    setIsSyncStatusLoading(true);
    try {
      const response = await fetchRaSyncStatus();
      if (!response.success || !response.data) throw new Error("status");
      setSyncStatus(response.data);
      return true;
    } catch {
      setSyncError("RA 동기화 상태를 불러오지 못했습니다.");
      return false;
    } finally {
      setIsSyncStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
    void loadSyncStatus();
  }, [loadEvents, loadSyncStatus]);
  useEffect(() => {
    if (isLoading || isPageMetaDirty || isSaving || isPosterBusy || isFetching)
      return;
    setPageMeta(allContent[currentEditLanguage].pageMeta);
    setIsPageMetaDirty(false);
    setPageMetaLanguage(currentEditLanguage);
  }, [
    allContent,
    currentEditLanguage,
    isFetching,
    isLoading,
    isPageMetaDirty,
    isPosterBusy,
    isSaving,
  ]);
  useEffect(() => {
    let active = true;
    void fetchRaApiConfig()
      .then((response) => {
        if (!active) return;
        if (response.success && response.data) setConfig(response.data);
        else setConfigFailed(true);
      })
      .catch(() => {
        if (active) setConfigFailed(true);
      })
      .finally(() => {
        if (active) setIsConfigLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setConfigField = <Field extends "userId" | "djId" | "option" | "year">(
    field: Field,
    value: RAApiConfigView[Field],
  ) => {
    setConfig((previous) => ({ ...previous, [field]: value }));
    setIsConfigDirty(true);
  };
  const updateField = (
    index: number,
    field: keyof Performance,
    value: string,
  ) => {
    const item = performances[index];
    if (item) updateItem(index, { ...item, [field]: value });
  };
  const updateMeta = (field: keyof PageMeta["events"], value: string) => {
    setPageMeta((previous) => ({
      ...previous,
      events: { ...previous.events, [field]: value },
    }));
    setIsPageMetaDirty(true);
  };
  const addEvent = () => {
    setSearch("");
    setFilter("all");
    setItems([
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        venue: "New Venue",
        title: "New Performance",
        location: "Seoul",
        time: "23:00",
        status: "TBA",
      },
      ...performances,
    ]);
  };

  const save = async () => {
    if (revision === null || isPosterBusy) return;
    if (isPageMetaDirty && pageMetaLanguage !== currentEditLanguage) {
      setSaveError("현재 언어의 페이지 설정을 불러온 뒤 저장해 주세요.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    setHasConflict(false);
    try {
      const [eventResult, metaResult] = await Promise.all([
        updatePerformances(performances, revision),
        apiUpdatePageMeta(currentEditLanguage, pageMeta),
      ]);
      if (!eventResult.success || !eventResult.data) {
        if (eventResult.error?.code === "CONFLICT") {
          setHasConflict(true);
          setSaveError(
            "다른 동기화 또는 관리자 변경이 먼저 반영되었습니다. 현재 입력은 유지됩니다. 최신 이벤트 목록을 확인한 뒤 다시 저장해 주세요.",
          );
          return;
        }
        setSaveError(
          "EVENTS 저장에 실패했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요.",
        );
        return;
      }
      applySnapshot(eventResult.data.items, eventResult.data.revision);
      let configOkay = true;
      if (isConfigDirty && !isConfigLoading && !configFailed) {
        const update: RAApiConfigUpdate = {
          userId: config.userId,
          djId: config.djId,
          option: config.option,
          year: config.year,
          ...(replacementKey.trim() && { apiKey: replacementKey.trim() }),
          ...(clearKey && { clearApiKey: true }),
        };
        const result = await updateRaApiConfig(update);
        configOkay = Boolean(result.success && result.data);
        if (result.success && result.data) {
          setConfig(result.data);
          setReplacementKey("");
          setClearKey(false);
          setIsConfigDirty(false);
        }
      }
      const failed = [
        !metaResult.success && "PAGE SETTINGS",
        !configOkay && "RA API CONFIG",
      ].filter(Boolean);
      if (failed.length) {
        setSaveError(
          `${failed.join(", ")} 저장에 실패했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요.`,
        );
        return;
      }
      updateContent({ performances: eventResult.data.items, pageMeta });
      setIsPageMetaDirty(false);
      setPageMetaLanguage(currentEditLanguage);
      showNotification();
      void loadSyncStatus();
    } catch {
      setSaveError(
        "저장 중 오류가 발생했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const reloadConflict = async () => {
    if (
      !window.confirm(
        "현재 저장하지 않은 이벤트 편집을 버리고 최신 목록을 불러올까요?",
      )
    )
      return;
    setSaveError("");
    await loadEvents();
  };
  const runSync = async () => {
    if (hasEventEdits || isConfigDirty) {
      setSyncError(
        "이벤트 또는 RA 설정의 저장하지 않은 변경을 먼저 저장해 주세요.",
      );
      return;
    }
    setIsFetching(true);
    setSyncError("");
    setSyncSuccess("");
    try {
      const response = await runRaSync();
      if (!response.success || !response.data) throw new Error("sync");
      setSyncStatus(response.data.status);
      await loadEvents();
      const result = response.data.result;
      if (result.kind === "success")
        setSyncSuccess(
          `${result.inserted ?? 0}개 추가됨${(result.skippedExcluded ?? 0) ? ` · ${result.skippedExcluded}개 제외` : ""}`,
        );
      else if (result.kind === "not-due")
        setSyncSuccess("현재 동기화 주기가 아니므로 실행하지 않았습니다.");
      else if (result.kind === "busy")
        setSyncError(
          "다른 동기화가 실행 중입니다. 잠시 후 다시 시도해 주세요.",
        );
      else if (result.kind === "not-configured")
        setSyncError("RA API 설정을 저장한 뒤 동기화할 수 있습니다.");
      else
        setSyncError(
          "RA 동기화에 실패했습니다. 상태를 확인한 뒤 다시 시도해 주세요.",
        );
    } catch {
      setSyncError(
        "RA 동기화를 실행하지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.",
      );
    } finally {
      setIsFetching(false);
    }
  };
  const restoreExclusion = async (raEventId: string) => {
    const result = await restoreRaEventExclusion(raEventId);
    if (!result.success) {
      setSyncError("제외 목록을 복원하지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    setSyncSuccess(
      "제외 목록에서 복원했습니다. 다음 수동 또는 정기 동기화에서 다시 확인합니다.",
    );
    await loadSyncStatus();
  };
  const changePoster = async (eventId: string, file?: File) => {
    if (hasEventEdits) {
      setPosterError((previous) => ({
        ...previous,
        [eventId]: "이벤트 변경을 먼저 저장한 뒤 포스터를 변경해 주세요.",
      }));
      return;
    }
    if (
      file &&
      (!POSTER_UPLOAD_TYPES.includes(file.type) || file.size > MAX_UPLOAD_BYTES)
    ) {
      setPosterError((previous) => ({
        ...previous,
        [eventId]: "JPG, PNG, WebP, AVIF, GIF 형식과 최대 10MB만 지원합니다.",
      }));
      return;
    }
    setPosterError((previous) => ({ ...previous, [eventId]: "" }));
    setPosterSuccess("");
    setPosterBusy((previous) => ({ ...previous, [eventId]: true }));
    try {
      const result = file
        ? await uploadEventPoster(eventId, file)
        : await deleteEventPoster(eventId);
      if (!result.success) throw new Error("poster");
      const refreshed = await loadEvents();
      if (refreshed) setPosterSuccess(file ? "포스터를 저장했습니다." : "포스터를 제거했습니다.");
    } catch {
      setPosterError((previous) => ({
        ...previous,
        [eventId]: "포스터 변경에 실패했습니다. 다시 시도해 주세요.",
      }));
    } finally {
      setPosterBusy((previous) => ({ ...previous, [eventId]: false }));
    }
  };

  const controlsDisabled =
    isSaving || isPosterBusy || isFetching || isEventsLoading;
  const canSync =
    !controlsDisabled &&
    !isConfigLoading &&
    !configFailed &&
    config.hasApiKey &&
    config.userId.trim() &&
    config.djId.trim() &&
    !hasEventEdits &&
    !isConfigDirty;
  const syncReason =
    hasEventEdits || isConfigDirty
      ? "이벤트 또는 RA 설정의 저장하지 않은 변경을 먼저 저장해 주세요."
      : !config.hasApiKey
        ? "RA API 키를 저장한 뒤 실행할 수 있습니다."
        : "";
  const hasLocaleDraft =
    isPageMetaDirty && pageMetaLanguage !== currentEditLanguage;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const visibleEvents = performances.map((item, index) => ({ item, index })).filter(({ item }) => {
    // Search the saved text so an active editor stays visible while its title changes.
    const searchable = savedItems.find((saved) => saved.id === item.id) ?? item;
    const matchesSearch = [searchable.title, searchable.venue, searchable.location, searchable.date]
      .some((value) => value?.toLowerCase().includes(search.trim().toLowerCase()));
    return matchesSearch && (filter === "all" || (filter === "missing" && !item.posterImageId) ||
      (filter === "upcoming" && item.date.replaceAll(".", "-") >= today) || (filter === "past" && item.date.replaceAll(".", "-") < today));
  });

  return (
    <div className="space-y-8">
      <AdminSectionHeader
        title="공연"
        description="공연 정보는 RA에서 동기화하고, 포스터는 직접 업로드합니다."
        onSave={save}
        isSaving={isSaving}
        isSaveDisabled={
          isConfigLoading ||
          isEventsLoading ||
          isPosterBusy ||
          isFetching ||
          hasConflict ||
          hasLocaleDraft
        }
        action={
          <button
            type="button"
            onClick={addEvent}
            disabled={controlsDisabled}
            className="px-6 py-3 border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors whitespace-nowrap cursor-pointer text-sm tracking-wider disabled:opacity-50"
            style={createBorderFaint()}
          >
            <span className="mr-2" aria-hidden="true">+</span>
            공연 추가
          </button>
        }
      />
      <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />
      <SaveErrorMessage message={saveError} />
      {hasLocaleDraft && (
        <p role="alert" className="text-sm text-red-400 tracking-wider">
          저장하지 않은 이전 언어의 페이지 설정이 있습니다. 해당 언어로 돌아가
          저장하거나 변경을 취소해 주세요.
        </p>
      )}
      {hasConflict && (
        <button
          type="button"
          onClick={() => void reloadConflict()}
          className="min-h-11 px-4 border border-[var(--color-secondary)]/40 text-sm text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10"
        >
          최신 이벤트 목록 불러오기 (현재 이벤트 편집 버림)
        </button>
      )}
      <fieldset
        disabled={controlsDisabled}
        className="space-y-8 disabled:opacity-60"
      >
        <section aria-label="공연 목록">
          <div className={collection.toolbar}>
            <FormInput label="공연 검색" type="search" value={search} onChange={setSearch} placeholder="공연명, 장소, 지역, 날짜" />
            <div className={collection.filters} role="group" aria-label="공연 필터">
              {[["all", "전체"], ["missing", "포스터 없음"], ["upcoming", "예정"], ["past", "지난 공연"]].map(([value, label]) =>
                <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
            </div>
          </div>
          <p className={collection.count} role="status">{isEventsLoading ? "이벤트를 불러오는 중입니다." : `${visibleEvents.length}개 표시 / 전체 ${performances.length}개`}</p>
          {hasEventEdits && <p id="event-poster-draft-help" className={collection.notice}>공연 변경 사항을 먼저 저장하면 포스터를 업로드할 수 있습니다.</p>}
          {posterSuccess && <p role="status" className={collection.notice}>{posterSuccess}</p>}
          <div className={collection.list}>
            {visibleEvents.map(({ item, index }) => deleteConfirm.isOpen && deleteConfirm.pendingIndex === index ? (
              <AdminCard key={item.id}><DeleteConfirmModal show itemName={item.title}
                onConfirm={() => deleteConfirm.confirmDelete(deleteItem)} onCancel={deleteConfirm.closeConfirm} /></AdminCard>
            ) : <EventEditor key={item.id} event={item} isNew={!savedItems.some((saved) => saved.id === item.id)}
                posterBusy={Boolean(posterBusy[item.id])} posterError={posterError[item.id]} hasEventEdits={hasEventEdits}
                onChange={(field, value) => updateField(index, field, value)}
                onPosterChange={(file) => void changePoster(item.id, file)} onDelete={() => deleteConfirm.openConfirm(index)} />)}
          </div>
          {!isEventsLoading && visibleEvents.length === 0 && <div className={collection.empty}>
            <p>{performances.length === 0 ? "등록된 공연이 없습니다. RA 동기화 또는 공연 추가로 시작하세요." : "조건에 맞는 공연이 없습니다."}</p>
            {performances.length > 0 && <button type="button" onClick={() => { setSearch(""); setFilter("all"); }}>필터 초기화</button>}
          </div>}
        </section>
        <details className={collection.disclosure} open>
          <summary>RA 공연 정보 동기화</summary>
          <div>              <RaSyncPanel
                status={syncStatus}
                isLoading={isSyncStatusLoading}
                isRunning={isFetching}
                error={syncError}
                success={syncSuccess}
                isRunDisabled={!canSync}
                disabledReason={syncReason}
                onRun={() => void runSync()}
                onRestoreExclusion={restoreExclusion}
              /></div>
        </details>
        <details className={collection.disclosure}>
          <summary>공연 페이지 문구</summary>
          <AdminCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="페이지 제목"
                value={pageMeta.events.title}
                onChange={(value) => updateMeta("title", value)}
                placeholder="EVENTS"
              />
              <FormInput
                label="페이지 설명"
                value={pageMeta.events.subtitle}
                onChange={(value) => updateMeta("subtitle", value)}
                placeholder="PERFORMANCE SCHEDULE & INFORMATION"
              />
              <FormInput
                label="예정 공연 제목"
                value={pageMeta.events.upcomingTitle}
                onChange={(value) => updateMeta("upcomingTitle", value)}
                placeholder="UPCOMING EVENTS"
              />
              <FormInput
                label="지난 공연 제목"
                value={pageMeta.events.pastTitle}
                onChange={(value) => updateMeta("pastTitle", value)}
                placeholder="PAST EVENTS"
              />
            </div>
          </AdminCard>
        </details>
        <details className={collection.disclosure}>
          <summary>RA 연결 설정</summary>
          <AdminCard>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label={t("events_api_userid")}
                  value={config.userId}
                  onChange={(value) => setConfigField("userId", value)}
                  placeholder="123456"
                  disabled={isConfigLoading || configFailed}
                />
                <FormInput
                  id="ra-api-key"
                  label={t("events_api_key")}
                  type="password"
                  value={replacementKey}
                  onChange={(value) => {
                    setReplacementKey(value);
                    if (value.trim()) setClearKey(false);
                    setIsConfigDirty(true);
                  }}
                  placeholder={
                    config.hasApiKey
                      ? "저장된 키 유지 — 교체할 때만 입력"
                      : "새 API 키 입력"
                  }
                  autoComplete="new-password"
                  aria-describedby="ra-api-key-status"
                  disabled={isConfigLoading || configFailed}
                />
                <FormInput
                  label={t("events_api_djid")}
                  value={config.djId}
                  onChange={(value) => setConfigField("djId", value)}
                  placeholder="123456"
                  disabled={isConfigLoading || configFailed}
                />
                <FormSelect
                  id="ra-api-option"
                  name="raApiOption"
                  label={t("events_api_option")}
                  value={config.option}
                  onChange={(value) =>
                    setConfigField("option", value as RAApiConfigView["option"])
                  }
                  disabled={isConfigLoading || configFailed}
                >
                  <option value="1">{t("events_api_option_1")}</option>
                  <option value="2">{t("events_api_option_2")}</option>
                  <option value="3">{t("events_api_option_3")}</option>
                  <option value="4">{t("events_api_option_4")}</option>
                </FormSelect>
                <FormInput
                  label="YEAR (선택사항, 미입력시 올해 기준)"
                  value={config.year ?? ""}
                  onChange={(value) => setConfigField("year", value)}
                  placeholder="2026"
                  disabled={isConfigLoading || configFailed}
                />
              </div>
              {!isConfigLoading && !configFailed && (
                <div className="space-y-2 text-xs tracking-wider text-[var(--color-secondary)]/70">
                  <p id="ra-api-key-status" role="status" aria-live="polite">
                    {config.hasApiKey ? "API 키 저장됨" : "저장된 API 키 없음"}
                  </p>
                  {config.hasApiKey && (
                    <label className="inline-flex min-h-11 items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clearKey}
                        onChange={(event) => {
                          setClearKey(event.target.checked);
                          if (event.target.checked) setReplacementKey("");
                          setIsConfigDirty(true);
                        }}
                      />
                      저장된 API 키 제거
                    </label>
                  )}
                </div>
              )}
              {configFailed && (
                <p role="alert" className="text-sm text-red-400 tracking-wider">
                  RA API 설정을 불러오지 못했습니다. 설정 저장과 동기화가
                  비활성화됩니다.
                </p>
              )}

            </div>
          </AdminCard>
        </details>

      </fieldset>
    </div>
  );
}
