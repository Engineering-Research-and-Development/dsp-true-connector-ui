export interface GenericApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface PageInfo {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number; // current page number (0-based)
}

export interface Link {
  rel: string;
  href: string;
}

export interface PagedContent<T> {
  links: Link[];
  content: T[];
  page: PageInfo;
}

export interface PagedAPIResponse<T> {
  response: GenericApiResponse<PagedContent<T>>;
}
