import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useLanguage } from "./LanguageContext";
import { fetchContent } from "@/services/contentService";
import type {
  ContentData,
  MultiLanguageContent,
  MusicContent,
  EventsContent,
  ContactContent,
} from "../types/content";
import { DISPLAY_SETTINGS_DEFAULTS } from "../types/displaySettings";
import type { AllDisplaySettings } from "../types/displaySettings";

interface ContentContextType {
  content: ContentData;
  updateContent: (updates: Partial<ContentData>) => void;
  musicContent: MusicContent;
  eventsContent: EventsContent;
  contactContent: ContactContent;
  currentEditLanguage: "en" | "ko";
  setCurrentEditLanguage: (lang: "en" | "ko") => void;
  allContent: MultiLanguageContent;
  displaySettings: AllDisplaySettings;
}

const defaultEnContent: ContentData = {
  artistInfo: [
    { id: "1", key: "Name", value: "ARTIST NAME" },
    { id: "2", key: "Genre", value: "Techno / House" },
    { id: "3", key: "Location", value: "Seoul, South Korea" },
    { id: "4", key: "Status", value: "Active" },
  ],
  aboutSections: [
    {
      id: "bio",
      title: "BIOGRAPHY",
      type: "paragraphs",
      order: 0,
      paragraphs: [
        "Artist biography paragraph 1. This is where you can describe your musical journey, influences, and artistic vision.",
        "Artist biography paragraph 2. Continue your story here with more details about your career and achievements.",
      ],
    },
    {
      id: "musical-phil",
      title: "MUSICAL PHILOSOPHY",
      type: "philosophy-items",
      order: 1,
      items: [
        {
          id: "1",
          quote: "Music is the universal language of mankind.",
          description:
            "A deep exploration of sound, rhythm, and emotion through electronic music.",
        },
      ],
    },
    {
      id: "design-phil",
      title: "DESIGN PHILOSOPHY",
      type: "paragraphs",
      order: 2,
      paragraphs: [
        "Minimalism meets functionality. Every element serves a purpose.",
      ],
    },
  ],
  pageMeta: {
    home: { navTitle: "NAVIGATION" },
    music: { title: "MUSIC", subtitle: "TRACKS & MIXES" },
    events: {
      title: "EVENTS",
      subtitle: "PERFORMANCE SCHEDULE & INFORMATION",
      upcomingTitle: "UPCOMING EVENTS",
      pastTitle: "PAST EVENTS",
    },
    contact: {
      title: "CONTACT",
      subtitle: "GUESTBOOK & DIRECT CONTACT",
      guestbookTitle: "GUESTBOOK",
      directTitle: "DIRECT CONTACT",
      bookingTitle: "BOOKING INFO",
    },
    link: {
      title: "CONNECT",
      subtitle: "SOCIAL MEDIA & PLATFORMS",
      terminalTitle: "TERMINAL.STANN.KR",
    },
  },
  homeSections: [
    {
      title: "ABOUT",
      description: "Artist profile & philosophy",
      path: "/about",
      icon: "ri-user-line",
    },
    {
      title: "MUSIC",
      description: "Tracks, mixes & releases",
      path: "/music",
      icon: "ri-music-2-line",
    },
    {
      title: "EVENTS",
      description: "Performance schedule & info",
      path: "/events",
      icon: "ri-calendar-event-line",
    },
    {
      title: "CONTACT",
      description: "Guestbook & messages",
      path: "/contact",
      icon: "ri-mail-line",
    },
    {
      title: "LINK",
      description: "External connections",
      path: "/link",
      icon: "ri-links-line",
    },
  ],
  tracks: [
    {
      id: "1",
      title: "Midnight Drive",
      type: "Original Mix",
      duration: "6:42",
      year: "2024",
      platform: "SoundCloud",
      link: "https://soundcloud.com",
    },
    {
      id: "2",
      title: "Urban Pulse",
      type: "DJ Set",
      duration: "58:30",
      year: "2024",
      platform: "Mixcloud",
      link: "https://mixcloud.com",
    },
  ],
  performances: [
    {
      id: "1",
      date: "2024-12-31",
      venue: "CONTRA Seoul",
      location: "Seoul, South Korea",
      time: "23:00",
      title: "CONTRA Seoul",
      lineup: "Artist Name, Guest DJ",
      status: "Confirmed",
    },
    {
      id: "2",
      date: "2024-11-15",
      venue: "MODECI",
      location: "Seoul, South Korea",
      time: "22:00",
      title: "MODECI Night",
      lineup: "Artist Name",
      status: "Confirmed",
    },
  ],
  eventsInfo: {
    setDurations: ["1-2 hours", "2-4 hours", "All night"],
    technicalRequirements: ["CDJ-3000 x2", "DJM-900NXS2", "Monitor speakers"],
    contactEmail: "booking@artist.com",
    responseTime: "24-48 hours",
  },
  linkPlatforms: [
    {
      id: "1",
      platform: "SoundCloud",
      url: "https://soundcloud.com/artist",
      icon: "ri-soundcloud-line",
      description: "Listen to my tracks and mixes",
    },
    {
      id: "2",
      platform: "Instagram",
      url: "https://instagram.com/artist",
      icon: "ri-instagram-line",
      description: "Follow my journey",
    },
    {
      id: "3",
      platform: "Resident Advisor",
      url: "https://ra.co/dj/artist",
      icon: "ri-calendar-line",
      description: "Check my event schedule",
    },
  ],
  terminalInfo: {
    url: "https://example.com",
    description: "Side project or additional portfolio",
  },
  contactInfo: [
    {
      label: "EMAIL",
      value: "contact@artist.com",
      icon: "ri-mail-line",
    },
    {
      label: "INSTAGRAM",
      value: "@artist",
      icon: "ri-instagram-line",
    },
    {
      label: "BOOKING",
      value: "booking@artist.com",
      icon: "ri-briefcase-line",
    },
  ],
  themeColors: {
    primary: "#00ff00",
    secondary: "#ffffff",
    accent: "#00ff00",
    muted: "#666666",
    bg: "#000000",
    bgSidebar: "#000000",
  },
};

const defaultKoContent: ContentData = {
  artistInfo: [
    { id: "1", key: "이름", value: "아티스트 이름" },
    { id: "2", key: "장르", value: "테크노 / 하우스" },
    { id: "3", key: "위치", value: "서울, 대한민국" },
    { id: "4", key: "상태", value: "활동 중" },
  ],
  aboutSections: [
    {
      id: "bio",
      title: "바이오그래피",
      type: "paragraphs",
      order: 0,
      paragraphs: [
        "아티스트 바이오그래피 첫 번째 단락. 여기에 음악적 여정, 영향, 예술적 비전을 설명할 수 있습니다.",
        "아티스트 바이오그래피 두 번째 단락. 경력과 성과에 대한 자세한 내용을 계속 작성하세요.",
      ],
    },
    {
      id: "musical-phil",
      title: "음악 철학",
      type: "philosophy-items",
      order: 1,
      items: [
        {
          id: "1",
          quote: "음악은 인류의 보편적 언어입니다.",
          description: "전자 음악을 통한 소리, 리듬, 감정의 깊은 탐구.",
        },
      ],
    },
    {
      id: "design-phil",
      title: "디자인 철학",
      type: "paragraphs",
      order: 2,
      paragraphs: ["미니멀리즘과 기능성의 만남. 모든 요소는 목적을 가집니다."],
    },
  ],
  pageMeta: {
    home: { navTitle: "네비게이션" },
    music: { title: "음악", subtitle: "트랙 & 믹스" },
    events: {
      title: "이벤트",
      subtitle: "공연 일정 & 정보",
      upcomingTitle: "다가오는 이벤트",
      pastTitle: "지난 이벤트",
    },
    contact: {
      title: "연락처",
      subtitle: "방명록 & 직접 연락",
      guestbookTitle: "방명록",
      directTitle: "직접 연락",
      bookingTitle: "예약 정보",
    },
    link: {
      title: "연결",
      subtitle: "소셜 미디어 & 플랫폼",
      terminalTitle: "TERMINAL.STANN.KR",
    },
  },
  homeSections: [
    {
      title: "ABOUT",
      description: "아티스트 프로필 & 철학",
      path: "/about",
      icon: "ri-user-line",
    },
    {
      title: "MUSIC",
      description: "트랙, 믹스 & 릴리스",
      path: "/music",
      icon: "ri-music-2-line",
    },
    {
      title: "EVENTS",
      description: "공연 일정 & 정보",
      path: "/events",
      icon: "ri-calendar-event-line",
    },
    {
      title: "CONTACT",
      description: "방명록 & 메시지",
      path: "/contact",
      icon: "ri-mail-line",
    },
    {
      title: "LINK",
      description: "외부 연결",
      path: "/link",
      icon: "ri-links-line",
    },
  ],
  tracks: [
    {
      id: "1",
      title: "Midnight Drive",
      type: "Original Mix",
      duration: "6:42",
      year: "2024",
      platform: "SoundCloud",
      link: "https://soundcloud.com",
    },
    {
      id: "2",
      title: "Urban Pulse",
      type: "DJ Set",
      duration: "58:30",
      year: "2024",
      platform: "Mixcloud",
      link: "https://mixcloud.com",
    },
  ],
  performances: [
    {
      id: "1",
      date: "2024-12-31",
      venue: "FAUST Seoul",
      location: "서울, 대한민국",
      time: "23:00",
      title: "FAUST Seoul",
      lineup: "아티스트 이름, 게스트 DJ",
      status: "Confirmed",
    },
    {
      id: "2",
      date: "2024-11-15",
      venue: "FAUST",
      location: "서울, 대한민국",
      time: "22:00",
      title: "FAUST Night",
      lineup: "아티스트 이름",
      status: "Confirmed",
    },
  ],
  eventsInfo: {
    setDurations: ["1-2시간", "2-4시간", "올나잇"],
    technicalRequirements: ["CDJ-3000 x2", "DJM-900NXS2", "모니터 스피커"],
    contactEmail: "booking@artist.com",
    responseTime: "24-48시간",
  },
  linkPlatforms: [
    {
      id: "1",
      platform: "SoundCloud",
      url: "https://soundcloud.com/artist",
      icon: "ri-soundcloud-line",
      description: "트랙과 믹스 듣기",
    },
    {
      id: "2",
      platform: "Instagram",
      url: "https://instagram.com/artist",
      icon: "ri-instagram-line",
      description: "여정 팔로우하기",
    },
    {
      id: "3",
      platform: "Resident Advisor",
      url: "https://ra.co/dj/artist",
      icon: "ri-calendar-line",
      description: "이벤트 일정 확인",
    },
  ],
  terminalInfo: {
    url: "https://example.com",
    description: "사이드 프로젝트 또는 추가 포트폴리오",
  },
  contactInfo: [
    {
      label: "이메일",
      value: "contact@artist.com",
      icon: "ri-mail-line",
    },
    {
      label: "인스타그램",
      value: "@artist",
      icon: "ri-instagram-line",
    },
    {
      label: "예약",
      value: "booking@artist.com",
      icon: "ri-briefcase-line",
    },
  ],
  themeColors: {
    primary: "#00ff00",
    secondary: "#ffffff",
    accent: "#00ff00",
    muted: "#666666",
    bg: "#000000",
    bgSidebar: "#000000",
  },
};

const defaultMultiLanguageContent: MultiLanguageContent = {
  en: defaultEnContent,
  ko: defaultKoContent,
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage();
  const [currentEditLanguage, setCurrentEditLanguage] = useState<"en" | "ko">(
    "en",
  );

  // 서버/클라이언트 첫 렌더 모두 기본값으로 시작 — hydration 불일치 방지
  const [allContent, setAllContent] = useState<MultiLanguageContent>(
    defaultMultiLanguageContent,
  );

  useEffect(() => {
    // hydration 완료 후 D1 API에서 양 언어 콘텐츠 로드
    // API 미사용 환경(dev, DB 없음) → 기본값 유지
    Promise.all([fetchContent("en"), fetchContent("ko")]).then(
      ([enData, koData]) => {
        setAllContent({
          en: enData ?? defaultEnContent,
          ko: koData ?? defaultKoContent,
        });
      },
    );
  }, []);

  const content = allContent[language];

  useEffect(() => {
    // CSS 변수 적용
    const root = document.documentElement;
    root.style.setProperty("--color-primary", content.themeColors.primary);
    root.style.setProperty("--color-secondary", content.themeColors.secondary);
    root.style.setProperty("--color-accent", content.themeColors.accent);
    root.style.setProperty("--color-muted", content.themeColors.muted);
    root.style.setProperty("--color-bg", content.themeColors.bg);
    root.style.setProperty(
      "--color-bg-sidebar",
      content.themeColors.bgSidebar ?? content.themeColors.bg,
    );
  }, [content.themeColors]);

  /**
   * 인메모리 콘텐츠 업데이트 — 어드민 페이지 편집 시 즉시 UI 반영용.
   * 영구 저장은 각 어드민 페이지에서 adminService를 통해 D1에 직접 반영.
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
    eventsInfo: content.eventsInfo ?? defaultEnContent.eventsInfo,
  };
  const contactContent: ContactContent = {
    contactInfo: content.contactInfo ?? [],
  };

  // displaySettings: content에서 로드된 값 또는 기본값
  const displaySettings: AllDisplaySettings = content.displaySettings ?? DISPLAY_SETTINGS_DEFAULTS;

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
        displaySettings,
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
