/**
 * RA API XML 응답 타입
 */
export interface RAEventXML {
  id: string;
  venueid: string;
  title: string;
  eventdate: string;
  countryname: string;
  areaname: string;
  areaId: string;
  venue: string;
  address: string;
  lineup: string;
  time: string;
  cost: string;
  promoter: string;
  eventlink: string;
  venuelink: string;
  hastickets: string;
  hasbarcode: string;
}

/**
 * RA API 응답 타입
 */
export interface RAApiResponse {
  events: RAEventXML[];
}

/**
 * RA API 에러 타입
 */
export interface RAApiError {
  message: string;
  code?: string;
}