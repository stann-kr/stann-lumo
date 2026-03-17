import type { RAEventXML, RAApiResponse, RAApiError } from '../types/ra-api';
import type { Performance, RAApiConfig } from '../types/content';

/**
 * XML 문자열을 파싱하여 RAApiResponse 객체로 변환
 */
export function parseRAApiXML(xmlString: string): RAApiResponse {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  // 파싱 에러 체크
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML 파싱 실패: ' + parserError.textContent);
  }

  const eventNodes = xmlDoc.querySelectorAll('event');
  const events: RAEventXML[] = [];

  eventNodes.forEach((eventNode) => {
    const getTextContent = (tagName: string): string => {
      const element = eventNode.querySelector(tagName);
      return element?.textContent?.trim() || '';
    };

    events.push({
      id: getTextContent('id'),
      venueid: getTextContent('venueid'),
      title: getTextContent('title'),
      eventdate: getTextContent('eventdate'),
      countryname: getTextContent('countryname'),
      areaname: getTextContent('areaname'),
      areaId: getTextContent('areaId'),
      venue: getTextContent('venue'),
      address: getTextContent('address'),
      lineup: getTextContent('lineup'),
      time: getTextContent('time'),
      cost: getTextContent('cost'),
      promoter: getTextContent('promoter'),
      eventlink: getTextContent('eventlink'),
      venuelink: getTextContent('venuelink'),
      hastickets: getTextContent('hastickets'),
      hasbarcode: getTextContent('hasbarcode'),
    });
  });

  return { events };
}

/**
 * RA API 날짜 포맷 변환 (ISO → YYYY.MM.DD)
 */
export function formatRADate(isoDate: string): string {
  if (!isoDate) return '';
  
  try {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch {
    return '';
  }
}

/**
 * RA lineup HTML 태그 제거 및 정리
 */
export function cleanRALineup(lineup: string): string {
  if (!lineup) return '';
  
  // HTML 엔티티 디코딩
  const textarea = document.createElement('textarea');
  textarea.innerHTML = lineup;
  let decoded = textarea.value;
  
  // <artist id="xxx">name</artist> 형태를 name으로 변환
  decoded = decoded.replace(/<artist[^>]*>([^<]+)<\/artist>/g, '$1');
  
  // 남은 HTML 태그 제거
  decoded = decoded.replace(/<[^>]+>/g, '');
  
  // &nbsp; 등 공백 정리
  decoded = decoded.replace(/&nbsp;/g, ' ');
  
  // 연속된 공백 및 쉼표 정리
  decoded = decoded.replace(/\s*,\s*/g, ', ');
  decoded = decoded.replace(/\s+/g, ' ');
  
  return decoded.trim();
}

/**
 * RA Event를 Performance 타입으로 변환
 */
export function convertRAEventToPerformance(raEvent: RAEventXML): Performance {
  return {
    id: `ra-${raEvent.id}`,
    date: formatRADate(raEvent.eventdate),
    venue: raEvent.venue || 'TBA',
    title: raEvent.title || raEvent.venue || 'TBA',
    location: raEvent.areaname || raEvent.countryname || '',
    lineup: cleanRALineup(raEvent.lineup),
    raEventLink: raEvent.eventlink || undefined,
    raEventId: raEvent.id,
    status: 'Confirmed',
  };
}

/**
 * RA API 호출
 */
export async function fetchRAEvents(config: RAApiConfig): Promise<RAApiResponse> {
  const { userId, apiKey, djId, option = '1' } = config;

  if (!userId || !apiKey || !djId) {
    throw new Error('RA API 설정이 완료되지 않았습니다. USERID, API KEY, DJID를 모두 입력해주세요.');
  }

  // RA API 엔드포인트
  const apiUrl = 'https://www.residentadvisor.net/api/events.asmx/GetEvents';

  // 쿼리 파라미터 구성
  const params = new URLSearchParams({
    AccessKey: `${userId}|${apiKey}`,
    DJID: djId,
    Option: option,
  });

  try {
    // CORS 이슈로 인해 프록시 사용 (필요시)
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`RA API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    return parseRAApiXML(xmlText);
  } catch (error) {
    const raError: RAApiError = {
      message: error instanceof Error ? error.message : 'RA API 호출 중 알 수 없는 오류가 발생했습니다.',
    };
    throw raError;
  }
}

/**
 * RA 이벤트 목록을 Performance 배열로 변환
 */
export function convertRAEventsToPerformances(raEvents: RAEventXML[]): Performance[] {
  return raEvents.map(convertRAEventToPerformance);
}

/**
 * 날짜 기준으로 Upcoming/Past 이벤트 분류
 */
export function categorizeEventsByDate(performances: Performance[]): {
  upcoming: Performance[];
  past: Performance[];
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming: Performance[] = [];
  const past: Performance[] = [];

  performances.forEach((perf) => {
    if (!perf.date) {
      upcoming.push(perf);
      return;
    }

    try {
      // YYYY.MM.DD 형식을 Date로 변환
      const [year, month, day] = perf.date.split('.').map(Number);
      const perfDate = new Date(year, month - 1, day);
      perfDate.setHours(0, 0, 0, 0);

      if (perfDate >= today) {
        upcoming.push(perf);
      } else {
        past.push(perf);
      }
    } catch {
      upcoming.push(perf);
    }
  });

  return { upcoming, past };
}

/**
 * 중복 이벤트 제거 (날짜 + 장소 기준)
 */
export function removeDuplicateEvents(performances: Performance[]): Performance[] {
  const seen = new Set<string>();
  const unique: Performance[] = [];

  performances.forEach((perf) => {
    const key = `${perf.date}-${perf.venue}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(perf);
    }
  });

  return unique;
}

/**
 * 이벤트를 날짜순으로 정렬 (최신순)
 */
export function sortEventsByDate(performances: Performance[], ascending = true): Performance[] {
  return [...performances].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;

    const [yearA, monthA, dayA] = a.date.split('.').map(Number);
    const [yearB, monthB, dayB] = b.date.split('.').map(Number);

    const dateA = new Date(yearA, monthA - 1, dayA).getTime();
    const dateB = new Date(yearB, monthB - 1, dayB).getTime();

    return ascending ? dateA - dateB : dateB - dateA;
  });
}