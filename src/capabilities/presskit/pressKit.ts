/**
 * Official press kit (2026-11, supplied by the artist). Static public content: the source of truth is the
 * artist's KO/EN press kit text, not D1. Update both languages together when the kit changes.
 */
import { CONTACT_EMAIL, INSTAGRAM_URL, SOUNDCLOUD_URL, TERMINAL_URL } from '@/constants/site';

export type PressKitLocale = 'ko' | 'en';

export interface PressKitCopy {
  title: string;
  shortBio: string;
  fullBio: [lead: string, ...rest: string[]];
  sound: string;
  liveSet: string;
  terminal: string;
  festivalKorea: string;
  videoNote: string;
  logoNote: string;
}

export const PRESS_KIT_COPY: Record<PressKitLocale, PressKitCopy> = {
  ko: {
    title: '프레스킷',
    shortBio: 'Stann Lumo는 서울 기반의 DJ/프로듀서이자 Faust Seoul 레지던트로, 유동적인 믹싱과 층층이 쌓이는 압력, 우주적인 질감으로 미래적이고 묵직한 힙노틱 테크노를 만든다. 자신의 음악 세계를 시각적·공간적으로 확장하는 디지털/라이브 인터페이스 프로젝트 TERMINAL을 전개하며, 그 무대에서 라이브 셋도 선보인다.',
    fullBio: [
      'Stann Lumo는 서울을 기반으로 활동하는 DJ/프로듀서이자 Faust Seoul의 레지던트다. 그의 사운드는 미래적이고 우주적인 감각의 힙노틱 테크노를 중심으로, 묵직한 저역의 압력감, 층층이 쌓이는 리듬, 그리고 여러 트랙을 유기적으로 엮는 유동적인 믹싱으로 형성된다.',
      'Faust를 기반으로 베를린의 Tresor와 HÖR, 암스테르담의 Radion, 로스토크의 UKW Kraftwerk에서 플레이했고, 국내에서는 Tor Festival과 High Tech Seoul 같은 페스티벌 무대에 올랐다. 이 감각은 프로덕션으로도 이어져, Frame Dragging과 Astral Prologue에는 밀도 높은 공간감과 무게감이 담겨 있다.',
      '또한 그는 음악 세계를 시각적·공간적으로 확장하는 디지털/라이브 인터페이스 프로젝트 TERMINAL을 전개하며, 그 무대에서 자신의 라이브 셋을 선보인다.',
    ],
    sound: 'Stann Lumo는 테크노를 무게감, 공간감, 움직임의 관계 안에서 다룬다. 그의 셋은 여러 트랙을 유기적으로 물려가며 흐름을 만드는 방식에 가깝고, 힙노틱한 추진력 위에 미래적인 질감과 묵직한 저역의 존재감을 함께 쌓아 올린다. 하나의 정해진 공식보다 대비와 압력, 그리고 지속적인 움직임 속에서 더 큰 곡선을 만드는 데 초점을 둔다.',
    liveSet: 'Stann Lumo는 DJ 셋과 함께 Ableton Live로 구성한 라이브 셋을 선보인다. 직접 전개하는 TERMINAL이 그 무대로, Faust Seoul에서 열린 TERMINAL 01(2026년 3월)과 TERMINAL 02(2026년 5월)에서 라이브 셋을 공연했다.',
    terminal: 'TERMINAL은 Stann Lumo가 전개하는 관련 디지털/라이브 인터페이스 프로젝트다. 그의 음악 세계를 시각적·공간적으로 확장하는 별도 프로젝트로, 사운드를 둘러싼 맥락과 라이브 경험을 다룬다. 2026년부터 Faust Seoul에서 이벤트로 이어지고 있다.',
    festivalKorea: '국내 페스티벌',
    videoNote: `공연 영상 12편을 원본 MP4로 내려받을 수 있습니다. 다른 자료가 필요하면 ${CONTACT_EMAIL}로 문의해 주세요.`,
    logoNote: '로고를 늘리거나 색을 바꾸거나 외곽선·효과를 넣지 마세요. 주변 여백은 글자 높이 이상 확보해 주세요.',
  },
  en: {
    title: 'Press kit',
    shortBio: 'Stann Lumo is a Seoul-based DJ/producer and Faust Seoul resident working in futuristic, weighty hypnotic techno shaped by fluid mixing, layered pressure, and space-like texture. He also develops TERMINAL, a digital/live interface project that extends his music visually and spatially and serves as the stage for his live set.',
    fullBio: [
      'Stann Lumo is a Seoul-based DJ/producer and resident at Faust Seoul, working in hypnotic techno that feels futuristic without losing its weight. His sets are built through layered pressure, heavy low-end movement, and fluid connections between tracks, linking diverse selections into momentum, impact, and spatial detail.',
      'From his home booth at Faust, that approach has carried him to Tresor and HÖR in Berlin, Radion in Amsterdam, and UKW Kraftwerk in Rostock, and onto Korean festival stages including Tor Festival and High Tech Seoul. In the studio, tracks such as Frame Dragging and Astral Prologue carry the same language into production: dense, space-like, and tuned for focused rooms.',
      'Alongside his DJ work, he develops TERMINAL, a digital/live interface project that extends his musical world visually and spatially, and uses it as the stage for his live set.',
    ],
    sound: 'Stann Lumo approaches techno through weight, space, and movement. His sets are built by layering and linking tracks into fluid sequences, balancing hypnotic drive with futuristic texture and heavy low-end presence. Rather than relying on a single fixed mood, he shapes a wider arc through contrast, pressure, and continuous motion.',
    liveSet: 'Alongside his DJ sets, Stann Lumo performs a live set built in Ableton Live. TERMINAL is where he presents it: he has performed live at TERMINAL 01 (March 2026) and TERMINAL 02 (May 2026) at Faust Seoul.',
    terminal: 'TERMINAL is a related digital/live interface project developed by Stann Lumo. A separate project that extends his musical world visually and spatially, it deals with the context around the sound and the live experience. Since 2026 it has taken shape as a series of nights at Faust Seoul.',
    festivalKorea: 'Festival, Korea',
    videoNote: `All 12 performance clips download as original MP4 files. For anything else, email ${CONTACT_EMAIL}.`,
    logoNote: 'Please do not stretch, recolor, outline, or add effects. Keep clear space of at least the letter height.',
  },
};

export const PRESS_FACTS = {
  based: 'Seoul',
  residency: 'Faust Seoul',
  sound: 'Hypnotic techno',
  formats: 'DJ set · Live set (Ableton Live)',
  project: 'TERMINAL',
} as const;

export interface PressStage { name: string; city: string | 'festival-korea'; tag?: string; live?: { date: string; latest: boolean } }

export const PRESS_STAGES: PressStage[] = [
  { name: 'TERMINAL 02', city: 'Faust, Seoul', live: { date: '2026-05', latest: true } },
  { name: 'TERMINAL 01', city: 'Faust, Seoul', live: { date: '2026-03', latest: false } },
  { name: 'Faust', city: 'Seoul', tag: 'Resident' },
  { name: 'Tresor', city: 'Berlin' },
  { name: 'HÖR', city: 'Berlin' },
  { name: 'Radion', city: 'Amsterdam' },
  { name: 'UKW Kraftwerk', city: 'Rostock' },
  { name: 'Tor Festival', city: 'festival-korea' },
  { name: 'High Tech Seoul', city: 'festival-korea' },
];

export const PRESS_MIXES = [
  { title: 'Tresor, Berlin', meta: '2025-02-05', source: 'SoundCloud', url: 'https://soundcloud.com/stannlumo/tresor-berlin-february-5th-2025' },
  { title: 'HÖR, Berlin', meta: 'Video', source: 'YouTube', url: 'https://www.youtube.com/live/cVK15qBeSHU' },
  { title: 'Faust, Seoul', meta: '2025-01-10', source: 'SoundCloud', url: 'https://soundcloud.com/stannlumo/faust-january-10th-2025' },
] as const;

export const PRESS_RELEASES = [
  { title: 'Frame Dragging', source: 'Bandcamp', url: 'https://ameniiarecords.bandcamp.com/album/frame-dragging' },
  { title: 'Astral Prologue', source: 'Bandcamp', url: 'https://ameniiarecords.bandcamp.com/album/astral-prologue' },
  { title: 'In to the B', source: 'Bandcamp', url: 'https://ameniiarecords.bandcamp.com/album/in-to-the-b' },
] as const;

const DL = '/press/download';

export const PRESS_PHOTOS = [
  { preview: '/press/front.jpg', file: `${DL}/stann-lumo-photo-front.jpg`, size: '1767×2416 · JPG · 2.5MB', alt: { ko: '계단에서 아래를 내려다보는 흑백 사진', en: 'Black and white, low angle in a stairwell' } },
  { preview: '/press/portrait.jpg', file: `${DL}/stann-lumo-photo.jpg`, size: '1768×2416 · JPG · 1.4MB', alt: { ko: '조각된 돌벽 앞의 컬러 인물 사진', en: 'Colour portrait in front of a carved stone wall' } },
  { preview: '/press/profile.jpg', file: `${DL}/stann-lumo-photo-profile.png`, size: '1000×1000 · PNG · 0.3MB', alt: { ko: '흑백 스튜디오 프로필 사진', en: 'Black and white studio profile portrait' } },
] as const;

export const PRESS_LOGO_FILES = [
  { label: 'White SVG', file: `${DL}/logo/StannLumo_Logo_White.svg` },
  { label: 'White PNG', file: `${DL}/logo/StannLumo_Logo_White.png` },
  { label: 'White PDF', file: `${DL}/logo/StannLumo_Logo_White.pdf` },
  { label: 'White EPS', file: `${DL}/logo/StannLumo_Logo_White.eps` },
  { label: 'Black SVG', file: `${DL}/logo/StannLumo_Logo_Black.svg` },
  { label: 'Black PNG', file: `${DL}/logo/StannLumo_Logo_Black.png` },
  { label: 'Black PDF', file: `${DL}/logo/StannLumo_Logo_Black.pdf` },
  { label: 'Black EPS', file: `${DL}/logo/StannLumo_Logo_Black.eps` },
] as const;

export const PRESS_PDFS = { ko: `${DL}/stann-lumo-press-kit-ko.pdf`, en: `${DL}/stann-lumo-press-kit-en.pdf` } as const;

/** Performance clips live in R2 under `press/video/<file>` and are served by `/press/video/[file]`; posters are static. */
export const PRESS_VIDEO_PATH = '/press/video';

export interface PressVideoClip { file: string; duration: string; size: string }

const clip = (file: string, duration: string, size: string): PressVideoClip => ({ file: `stann-lumo-${file}.mp4`, duration, size });

export const PRESS_VIDEOS: { venue: string; clips: PressVideoClip[] }[] = [
  { venue: 'Faust, Seoul', clips: [clip('faust-1', '0:18', '17.5MB'), clip('faust-2', '1:18', '85.3MB'), clip('faust-3', '0:13', '12.0MB'), clip('faust-4', '0:43', '50.4MB'), clip('faust-5', '1:03', '74.0MB')] },
  { venue: 'HÖR, Berlin', clips: [clip('hor-berlin-1', '0:27', '3.6MB'), clip('hor-berlin-2', '0:30', '4.1MB'), clip('hor-berlin-3', '0:29', '4.0MB'), clip('hor-berlin-4', '0:44', '33.8MB')] },
  { venue: 'High Tech Seoul', clips: [clip('high-tech-seoul-1', '0:25', '6.6MB'), clip('high-tech-seoul-2', '0:15', '12.3MB'), clip('high-tech-seoul-3', '0:23', '26.5MB')] },
];

/** The only files the video route will read from R2. */
export const PRESS_VIDEO_FILES: ReadonlySet<string> = new Set(PRESS_VIDEOS.flatMap((venue) => venue.clips.map((item) => item.file)));

export const pressVideoPoster = (file: string) => `/press/poster/${file.replace(/\.mp4$/, '.jpg')}`;

export const PRESS_CONTACT = [
  { label: 'Web', value: 'lumo.stann.kr', url: 'https://lumo.stann.kr/' },
  { label: 'Instagram', value: '@stannlumo', url: INSTAGRAM_URL },
  { label: 'SoundCloud', value: 'soundcloud.com/stannlumo', url: SOUNDCLOUD_URL },
  { label: 'TERMINAL', value: 'terminal.stann.kr', url: TERMINAL_URL },
] as const;

export { CONTACT_EMAIL };
