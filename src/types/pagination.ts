export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: {
    items: T[];
    pagination: PaginationInfo;
    search_query?: string;
  };
  error?: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
}
