import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AdminEditGuardProvider,
  useAdminEditGuard,
} from "@/capabilities/admin/AdminEditGuard";
import type { ContentData, PageMeta } from "@/capabilities/content/content";
import type { RAApiConfigView } from "@/capabilities/events/raConfig";
import AdminEventsPage from "./page";

const mocks = vi.hoisted(() => ({
  currentEditLanguage: "en" as "en" | "ko",
  fetchPerformancesSnapshot: vi.fn(),
  fetchRaApiConfig: vi.fn(),
  fetchRaSyncStatus: vi.fn(),
  updatePerformances: vi.fn(),
  updateRaApiConfig: vi.fn(),
  runRaSync: vi.fn(),
  updatePageMeta: vi.fn(),
  updateContent: vi.fn(),
  uploadEventPoster: vi.fn(),
  showNotification: vi.fn(),
}));

const pageMeta = (title: string): PageMeta => ({
  home: { navTitle: "HOME" },
  music: { title: "MUSIC", subtitle: "" },
  events: { title, subtitle: "", upcomingTitle: "UPCOMING", pastTitle: "PAST" },
  contact: {
    title: "CONTACT",
    subtitle: "",
    guestbookTitle: "",
    directTitle: "",
    bookingTitle: "",
  },
  link: { title: "LINK", subtitle: "", terminalTitle: "" },
});

const content = (title: string): ContentData => ({
  artistInfo: [],
  aboutSections: [],
  pageMeta: pageMeta(title),
  homeSections: [],
  tracks: [],
  performances: [],
  eventsInfo: {
    setDurations: [],
    technicalRequirements: [],
    contactEmail: "",
    responseTime: "",
  },
  linkPlatforms: [],
  terminalInfo: { url: "", description: "" },
  contactInfo: [],
});

const allContent = { en: content("EVENTS EN"), ko: content("EVENTS KO") };

vi.mock("@/contexts/ContentContext", () => ({
  useContent: () => ({
    allContent,
    currentEditLanguage: mocks.currentEditLanguage,
    isLoading: false,
    updateContent: mocks.updateContent,
  }),
}));
vi.mock("@/capabilities/content/contentAdmin.client", () => ({
  updatePageMeta: mocks.updatePageMeta,
}));
vi.mock("@/capabilities/events/eventsAdmin.client", () => ({
  fetchPerformancesSnapshot: mocks.fetchPerformancesSnapshot,
  fetchRaApiConfig: mocks.fetchRaApiConfig,
  fetchRaSyncStatus: mocks.fetchRaSyncStatus,
  updatePerformances: mocks.updatePerformances,
  updateRaApiConfig: mocks.updateRaApiConfig,
  uploadEventPoster: mocks.uploadEventPoster,
  deleteEventPoster: vi.fn(),
  runRaSync: mocks.runRaSync,
  restoreRaEventExclusion: vi.fn(),
}));
vi.mock("@/capabilities/events/raApi.client", () => ({
  sortEventsByDate: vi.fn((items: unknown[]) => items),
}));
vi.mock("@/capabilities/admin/useSaveNotification", () => ({
  useSaveNotification: () => ({
    isVisible: false,
    showNotification: mocks.showNotification,
  }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const DirtyState = () => {
  const { isDirty } = useAdminEditGuard();
  return <output data-testid="dirty-state">{String(isDirty)}</output>;
};

const renderPage = () => {
  const view = render(
    <AdminEditGuardProvider>
      <AdminEventsPage />
      <DirtyState />
    </AdminEditGuardProvider>,
  );
  fireEvent.click(screen.getByText("RA 연결 설정"));
  fireEvent.click(screen.getByText("공연 페이지 문구"));
  return view;
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

describe("AdminEventsPage performance snapshots", () => {
  beforeEach(() => {
    mocks.currentEditLanguage = "en";
    vi.clearAllMocks();
    mocks.fetchPerformancesSnapshot.mockResolvedValue({
      success: true,
      data: {
        revision: 3,
        items: [
          {
            id: "ra-1",
            title: "Original",
            date: "2026-09-01",
            venue: "Venue",
            status: "Announced",
          },
        ],
      },
    });
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: true,
      data: { userId: "1", djId: "2", option: "1", year: "", hasApiKey: true },
    });
    mocks.fetchRaSyncStatus.mockResolvedValue({
      success: true,
      data: {
        lastStatus: "never",
        lastStartedAt: null,
        lastCompletedAt: null,
        lastSuccessAt: null,
        lastErrorCode: null,
        fetched: 0,
        inserted: 0,
        skippedExcluded: 0,
        nextScheduledAt: 0,
        nextRetryAt: null,
        exclusions: [],
      },
    });
    mocks.updatePageMeta.mockResolvedValue({ success: true });
    mocks.updatePerformances.mockResolvedValue({
      success: true,
      data: {
        revision: 4,
        items: [
          {
            id: "ra-1",
            title: "Original",
            date: "2026-09-01",
            venue: "Venue",
            status: "Announced",
          },
        ],
      },
    });
    mocks.updateRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: "1",
        djId: "2",
        option: "1",
        year: "",
        hasApiKey: true,
      },
    });
    mocks.runRaSync.mockResolvedValue({
      success: true,
      data: {
        result: {
          kind: "success",
          fetched: 1,
          inserted: 0,
          skippedExcluded: 0,
        },
        status: {
          lastStatus: "success",
          lastStartedAt: 0,
          lastCompletedAt: 0,
          lastSuccessAt: 0,
          lastErrorCode: null,
          fetched: 1,
          inserted: 0,
          skippedExcluded: 0,
          nextScheduledAt: 0,
          nextRetryAt: null,
          exclusions: [],
        },
      },
    });
  });

  it("keeps the edited event visible after a stale revision conflict", async () => {
    mocks.updatePerformances.mockResolvedValue({
      success: false,
      error: { code: "CONFLICT", message: "stale" },
    });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "상세 편집 Original" }));
    const title = await screen.findByLabelText("공연 제목");
    fireEvent.change(title, { target: { value: "My draft" } });
    fireEvent.click(screen.getByRole("button", { name: "변경 사항 저장" }));
    await screen.findByText(/현재 입력은 유지됩니다/);
    expect(screen.getByLabelText("공연 제목")).toHaveValue("My draft");
    expect(
      screen.getByRole("button", { name: /최신 이벤트 목록/ }),
    ).toBeInTheDocument();
  });

  it("uses the selected locale page settings only while no draft is dirty", async () => {
    const view = renderPage();
    expect(await screen.findByDisplayValue("EVENTS EN")).toBeInTheDocument();
    mocks.currentEditLanguage = "ko";
    view.rerender(
      <AdminEditGuardProvider>
        <AdminEventsPage />
        <DirtyState />
      </AdminEditGuardProvider>,
    );
    await waitFor(() =>
      expect(screen.getByDisplayValue("EVENTS KO")).toBeInTheDocument(),
    );
  });

  it("keeps the edit guard dirty while a page setting draft refreshes events through manual sync", async () => {
    renderPage();
    const title = await screen.findByLabelText("페이지 제목");
    fireEvent.change(title, { target: { value: "Draft title" } });
    await waitFor(() =>
      expect(screen.getByTestId("dirty-state")).toHaveTextContent("true"),
    );

    fireEvent.click(screen.getByRole("button", { name: "RA 정보 가져오기" }));
    await waitFor(() => expect(mocks.runRaSync).toHaveBeenCalledTimes(1));
    await screen.findByText("0개 추가됨");
    await waitFor(() =>
      expect(mocks.fetchPerformancesSnapshot).toHaveBeenCalledTimes(2),
    );
    expect(screen.getByLabelText("페이지 제목")).toHaveValue("Draft title");
    await waitFor(() =>
      expect(screen.getByTestId("dirty-state")).toHaveTextContent("true"),
    );
  });

  it("loads protected config once, disables save and sync while pending, and keeps it across locale changes", async () => {
    const config: RAApiConfigView = {
      userId: "user-fixture",
      djId: "dj-fixture",
      option: "2",
      year: "2026",
      hasApiKey: true,
    };
    const pending = deferred<{ success: true; data: RAApiConfigView }>();
    mocks.fetchRaApiConfig.mockReturnValue(pending.promise);
    const view = renderPage();

    expect(screen.getByRole("button", { name: "변경 사항 저장" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "RA 정보 가져오기" })).toBeDisabled();
    expect(mocks.fetchRaApiConfig).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve({ success: true, data: config });
      await pending.promise;
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "변경 사항 저장" }),
      ).toBeEnabled(),
    );
    const apiKeyInput = screen.getByLabelText("events_api_key");
    expect(apiKeyInput).toHaveValue("");
    expect(apiKeyInput).toHaveAttribute("type", "password");
    expect(apiKeyInput).toHaveAttribute("autocomplete", "new-password");
    expect(apiKeyInput).toHaveAccessibleDescription("API 키 저장됨");

    mocks.currentEditLanguage = "ko";
    view.rerender(
      <AdminEditGuardProvider>
        <AdminEventsPage />
        <DirtyState />
      </AdminEditGuardProvider>,
    );
    expect(screen.getByLabelText("events_api_key")).toHaveValue("");
    expect(mocks.fetchRaApiConfig).toHaveBeenCalledTimes(1);
  });

  it("keeps base saves working but never writes protected config after its load fails", async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: false,
      error: { code: "NETWORK_ERROR", message: "test" },
    });
    renderPage();
    await screen.findByText(/RA API 설정을 불러오지 못했습니다/);
    fireEvent.click(screen.getByRole("button", { name: "변경 사항 저장" }));
    await waitFor(() => {
      expect(mocks.updatePerformances).toHaveBeenCalledTimes(1);
      expect(mocks.updatePageMeta).toHaveBeenCalledTimes(1);
    });
    expect(mocks.updateRaApiConfig).not.toHaveBeenCalled();
    expect(mocks.showNotification).toHaveBeenCalledTimes(1);
  });

  it("requires a missing key to be saved before the server sync is available", async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: "user-fixture",
        djId: "dj-fixture",
        option: "2",
        year: "2026",
        hasApiKey: false,
      },
    });
    mocks.updateRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: "user-fixture",
        djId: "dj-fixture",
        option: "2",
        year: "2026",
        hasApiKey: true,
      },
    });
    renderPage();
    const syncButton = await screen.findByRole("button", {
      name: "RA 정보 가져오기",
    });
    expect(syncButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText("events_api_key"), {
      target: { value: "test-only-key" },
    });
    expect(syncButton).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "변경 사항 저장" }));
    await waitFor(() =>
      expect(mocks.updateRaApiConfig).toHaveBeenCalledWith({
        userId: "user-fixture",
        djId: "dj-fixture",
        option: "2",
        year: "2026",
        apiKey: "test-only-key",
      }),
    );
    await waitFor(() => expect(syncButton).toBeEnabled());
    fireEvent.click(syncButton);
    await waitFor(() => expect(mocks.runRaSync).toHaveBeenCalledTimes(1));
  });

  it("keeps ordinary event saves working when the RA connection has no key", async () => {
    mocks.fetchRaApiConfig.mockResolvedValue({
      success: true,
      data: {
        userId: "user-fixture",
        djId: "dj-fixture",
        option: "2",
        year: "2026",
        hasApiKey: false,
      },
    });
    renderPage();
    await screen.findByText("저장된 API 키 없음");
    fireEvent.click(screen.getByRole("button", { name: "변경 사항 저장" }));
    await waitFor(() =>
      expect(mocks.updatePerformances).toHaveBeenCalledTimes(1),
    );
    expect(mocks.updateRaApiConfig).not.toHaveBeenCalled();
    expect(mocks.showNotification).toHaveBeenCalledTimes(1);
  });

  it("locks credentials and server sync while the config save is pending", async () => {
    const pending = deferred<{ success: true; data: RAApiConfigView }>();
    mocks.updateRaApiConfig.mockReturnValue(pending.promise);
    renderPage();
    await screen.findByText("API 키 저장됨");
    fireEvent.change(screen.getByLabelText("events_api_key"), {
      target: { value: "test-only-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "변경 사항 저장" }));
    await waitFor(() =>
      expect(mocks.updateRaApiConfig).toHaveBeenCalledTimes(1),
    );
    expect(screen.getByLabelText("events_api_userid")).toBeDisabled();
    expect(screen.getByLabelText("events_api_key")).toBeDisabled();
    expect(screen.getByLabelText("events_api_option")).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "저장된 API 키 제거" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "RA 정보 가져오기" })).toBeDisabled();

    await act(async () => {
      pending.resolve({
        success: true,
        data: {
          userId: "1",
          djId: "2",
          option: "1",
          year: "",
          hasApiKey: true,
        },
      });
      await pending.promise;
    });
    await waitFor(() =>
      expect(screen.getByLabelText("events_api_key")).toBeEnabled(),
    );
  });

  it("does not show success when the masked config update fails", async () => {
    mocks.updateRaApiConfig.mockResolvedValue({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "test" },
    });
    renderPage();
    await screen.findByText("API 키 저장됨");
    fireEvent.change(screen.getByLabelText("events_api_option"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "변경 사항 저장" }));
    await screen.findByText(/RA API CONFIG 저장에 실패했습니다/);
    expect(mocks.showNotification).not.toHaveBeenCalled();
    expect(mocks.updateContent).not.toHaveBeenCalled();
    expect(screen.getByLabelText("events_api_option")).toHaveValue("3");
  });
  it("edits the selected filtered event and saves the entire snapshot", async () => {
    const items = [
      { id: "first", title: "Unchanged", date: "2026-10-01", venue: "A", status: "Announced", posterImageId: "poster-a" },
      { id: "second", title: "Target", date: "2026-10-02", venue: "B", status: "Announced" },
    ];
    mocks.fetchPerformancesSnapshot.mockResolvedValue({ success: true, data: { revision: 3, items } });
    renderPage();
    await screen.findByRole("article", { name: "Target" });
    fireEvent.click(screen.getByRole("button", { name: "포스터 없음" }));
    expect(screen.queryByRole("article", { name: "Unchanged" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("공연 검색"), { target: { value: "Target" } });
    fireEvent.click(screen.getByRole("button", { name: "상세 편집 Target" }));
    fireEvent.change(screen.getByLabelText("공연 제목"), { target: { value: "Edited target" } });
    // The search result remains stable while the user changes its matching text.
    expect(screen.getByLabelText("공연 제목")).toHaveValue("Edited target");
    expect(screen.getByLabelText("Edited target 포스터 업로드")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "변경 사항 저장" }));
    await waitFor(() => expect(mocks.updatePerformances).toHaveBeenCalledWith([
      items[0], { ...items[1], title: "Edited target" },
    ], 3));
  });

  it("uploads and replaces a poster for the selected event without changing metadata", async () => {
    const original = { id: "ra-1", title: "Original", date: "2026-09-01", venue: "Venue", status: "Announced" };
    const pending = deferred<{ success: true }>();
    mocks.uploadEventPoster.mockReturnValueOnce(pending.promise).mockResolvedValue({ success: true });
    mocks.fetchPerformancesSnapshot.mockResolvedValueOnce({ success: true, data: { revision: 3, items: [original] } })
      .mockResolvedValue({ success: true, data: { revision: 4, items: [{ ...original, posterImageId: "uploaded" }] } });
    renderPage();
    const input = await screen.findByLabelText("Original 포스터 업로드");
    const file = new File(["poster"], "poster.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(mocks.uploadEventPoster).toHaveBeenCalledWith("ra-1", file));
    expect(screen.getByRole("button", { name: "변경 사항 저장" })).toBeDisabled();
    await act(async () => { pending.resolve({ success: true }); await pending.promise; });
    const replacement = await screen.findByLabelText("Original 포스터 교체");
    expect(within(screen.getByRole("article", { name: "Original" })).getByAltText("")).toHaveAttribute("src", "/api/media/uploaded?v=2");
    fireEvent.change(replacement, { target: { files: [file] } });
    await waitFor(() => expect(mocks.uploadEventPoster).toHaveBeenCalledTimes(2));
    expect(mocks.updatePerformances).not.toHaveBeenCalled();
  });

  it("validates files before upload and reports a rejected upload without losing the event", async () => {
    mocks.uploadEventPoster.mockResolvedValue({ success: false });
    renderPage();
    const input = await screen.findByLabelText("Original 포스터 업로드");
    fireEvent.change(input, { target: { files: [new File(["text"], "bad.txt", { type: "text/plain" })] } });
    await screen.findByText(/최대 10MB만 지원/);
    expect(mocks.uploadEventPoster).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { files: [new File(["jpeg"], "poster.jpg", { type: "image/jpeg" })] } });
    await screen.findByText(/포스터 변경에 실패/);
    expect(screen.getByRole("article", { name: "Original" })).toBeInTheDocument();
    expect(screen.getByLabelText("Original 포스터 업로드")).toBeEnabled();
  });

});
