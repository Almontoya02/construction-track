export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
};

export type PaginationResult<T> = {
  data: T[];
  pagination: Pagination;
};

export type PaginationRequest = {
  page: number;
  pageSize: number;
  search: string;
};
