import Fuse from "fuse.js";

import type { PaginationRequest, PaginationResult } from "@/types/pagination";
import { URL } from "url";

export function parsePaginationParams(
  searchParams: URLSearchParams,
): PaginationRequest {
  const page = Math.max(0, Number(searchParams.get("page") || "0"));
  const pageSize = Number(searchParams.get("pageSize") || "10");

  return {
    page,
    pageSize,
    search: searchParams.get("search") || "",
  };
}

export function paginateArray<T>(
  data: T[],
  params: PaginationRequest,
): PaginationResult<T> {
  const { search, page, pageSize } = params;

  if (search) {
    const fuse = new Fuse(data, {
      keys: Object.keys(data[0] as any),
      threshold: 0.2,
    });
    data = fuse.search(search).map((result) => result.item);
  }

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Ensure page doesn't exceed total pages
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));

  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      page,
      pageSize,
      totalItems,
    },
  };
}

export async function paginateArrayFromLoader<T>(
  data: T[],
  request: Request,
): Promise<PaginationResult<T>> {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  return paginateArray(data, pagination);
}
