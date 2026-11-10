import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchContent } from './content.client';
import type {
  ContentData,
  MultiLanguageContent,
  MusicContent,
  EventsContent,
  ContactContent,
} from './content';

export type ContentStatus = "loading" | "ready" | "error";

interface ContentContextType {
  content: ContentData;
  updateContent: (updates: Partial<ContentData>) => void;
  musicContent: MusicContent;
  eventsContent: EventsContent;
  contactContent: ContactContent;
  currentEditLanguage: "en" | "ko";
  setCurrentEditLanguage: (lang: "en" | "ko") => void;
  allContent: MultiLanguageContent;
  contentStatus: ContentStatus;
  retryContent: () => void;
  isLoading: boolean;
  isError: boolean;
}

// 로딩 중 TypeScript 타입 충족을 위한 최소 구조 (UI에 노출되지 않음 — isLoading 스피너로 보호됨)
const EMPTY_CONTENT: ContentData = {
  artistInfo: [],
  aboutSections: [],
  pageMeta: {
    home: { navTitle: '' },
    music: { title: '', subtitle: '' },
    events: { title: '', subtitle: '', upcomingTitle: '', pastTitle: '' },
    contact: { title: '', subtitle: '', guestbookTitle: '', directTitle: '', bookingTitle: '' },
    link: { title: '', subtitle: '', terminalTitle: '' },
  },
  homeSections: [],
  tracks: [],
  performances: [],
  eventsInfo: { setDurations: [], technicalRequirements: [], contactEmail: '', responseTime: '' },
  linkPlatforms: [],
  terminalInfo: { url: '', description: '' },
  contactInfo: [],
};

const EMPTY_MULTILANG: MultiLanguageContent = { en: EMPTY_CONTENT, ko: EMPTY_CONTENT };

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage();
  const [currentEditLanguage, setCurrentEditLanguage] = useState<"en" | "ko">("en");

  const [allContent, setAllContent] = useState<MultiLanguageContent>(EMPTY_MULTILANG);
  const [contentStatus, setContentStatus] = useState<ContentStatus>("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const loadRequestRef = useRef(0);

  const retryContent = useCallback(() => {
    setContentStatus("loading");
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    const requestId = ++loadRequestRef.current;
    Promise.all([fetchContent("en"), fetchContent("ko")])
      .then(([enData, koData]) => {
        if (!enData || !koData) {
          throw new Error('Content fetch returned null');
        }

        // Ko 콘텐츠 미입력 항목은 En 콘텐츠로 대체
        const finalKo: ContentData = {
          ...koData,
          tracks:        koData.tracks?.length        ? koData.tracks        : enData.tracks,
          performances:  koData.performances?.length  ? koData.performances  : enData.performances,
          aboutSections: koData.aboutSections?.length ? koData.aboutSections : enData.aboutSections,
          homeSections:  koData.homeSections?.length  ? koData.homeSections  : enData.homeSections,
          linkPlatforms: koData.linkPlatforms?.length ? koData.linkPlatforms : enData.linkPlatforms,
          contactInfo:   koData.contactInfo?.length   ? koData.contactInfo   : enData.contactInfo,
          artistInfo:    koData.artistInfo?.length    ? koData.artistInfo    : enData.artistInfo,
        };

        if (loadRequestRef.current !== requestId) return;
        setAllContent({ en: enData, ko: finalKo });
        setContentStatus("ready");
      })
      .catch(() => {
        if (loadRequestRef.current !== requestId) return;
        setContentStatus("error");
      });

    return () => {
      if (loadRequestRef.current === requestId) loadRequestRef.current += 1;
    };
  }, [loadAttempt]);

  const content = allContent[language];

  /**
   * 인메모리 콘텐츠 업데이트 — 어드민 페이지 편집 시 즉시 UI 반영용.
   * 영구 저장은 각 어드민 페이지가 capability client(contentAdmin·eventsAdmin)로 D1에 직접 반영.
   */
  const updateContent = (updates: Partial<ContentData>) => {
    setAllContent((prev) => ({
      ...prev,
      [currentEditLanguage]: { ...prev[currentEditLanguage], ...updates },
    }));
  };

  const musicContent: MusicContent = { tracks: content.tracks ?? [] };
  const eventsContent: EventsContent = {
    performances: content.performances ?? [],
    eventsInfo: content.eventsInfo,
  };
  const contactContent: ContactContent = {
    contactInfo: content.contactInfo ?? [],
  };

  return (
    <ContentContext.Provider
      value={{
        content,
        updateContent,
        musicContent,
        eventsContent,
        contactContent,
        currentEditLanguage,
        setCurrentEditLanguage,
        allContent,
        contentStatus,
        retryContent,
        isLoading: contentStatus === "loading",
        isError: contentStatus === "error",
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be used within ContentProvider");
  }
  return context;
};
