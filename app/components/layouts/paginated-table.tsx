import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pagination } from "@/types/pagination";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";

export function PaginatedTable<T>({
  data,
  columns,
  pagination,
  extra,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  pagination: Pagination;
  extra?: React.ReactNode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const searchValue = searchParams.get("search") || "";

  const handleSearchChange = React.useCallback(
    (value: string) => {
      const newSearchParams = new URLSearchParams(searchParams);
      if (value) {
        newSearchParams.set("search", value);
      } else {
        newSearchParams.delete("search");
      }

      newSearchParams.set("page", "0");
      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams],
  );

  const [searchInput, setSearchInput] = React.useState(searchValue);
  const debouncedSearch = React.useMemo(() => {
    const timeoutRef = { current: null as NodeJS.Timeout | null };
    return (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        handleSearchChange(value);
      }, 300);
    };
  }, [handleSearchChange]);

  React.useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const urlParams = new URLSearchParams(searchParams);
    urlParams.set("pageSize", newPageSize);
    urlParams.set("page", "0"); // Reset to first page when changing page size
    setSearchParams(urlParams);
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const hasNextPage =
    pagination.page <
    Math.ceil(pagination.totalItems / pagination.pageSize) - 1;
  const hasPreviousPage = pagination.page > 0;

  const nextPageUrl = () => {
    const urlParams = new URLSearchParams(searchParams);
    urlParams.set("page", (pagination.page + 1).toString());
    urlParams.set("pageSize", pagination.pageSize.toString());
    return `?${urlParams.toString()}`;
  };

  const previousPageUrl = () => {
    const urlParams = new URLSearchParams(searchParams);
    urlParams.set("page", (pagination.page - 1).toString());
    urlParams.set("pageSize", pagination.pageSize.toString());
    return `?${urlParams.toString()}`;
  };

  const lastPageUrl = () => {
    const urlParams = new URLSearchParams(searchParams);
    urlParams.set(
      "page",
      (Math.ceil(pagination.totalItems / pagination.pageSize) - 1).toString(),
    );
    urlParams.set("pageSize", pagination.pageSize.toString());
    return `?${urlParams.toString()}`;
  };

  const firstPageUrl = () => {
    const urlParams = new URLSearchParams(searchParams);
    urlParams.set("page", "0");
    urlParams.set("pageSize", pagination.pageSize.toString());
    return `?${urlParams.toString()}`;
  };

  return (
    <Card className="w-full py-0!">
      <CardHeader className="border-b py-0!">
        <div className="flex justify-between items-center py-4">
          <Input
            placeholder="Search..."
            value={searchInput}
            onChange={handleInputChange}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            {extra}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="border-t py-0!">
        <div className="flex items-center justify-between space-x-2 py-4 w-full">
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="text-muted-foreground text-sm">
              Showing {pagination.page * pagination.pageSize + 1} to{" "}
              {Math.min(
                (pagination.page + 1) * pagination.pageSize,
                pagination.totalItems,
              )}{" "}
              of {pagination.totalItems} row(s).
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <div className="flex items-center space-x-2 mr-4">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[75px]">
                  <SelectValue placeholder={pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              asChild
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              size="icon"
              disabled={!hasPreviousPage}
            >
              <Link to={firstPageUrl()}>
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="size-8"
              size="icon"
              disabled={!hasPreviousPage}
            >
              <Link to={previousPageUrl()}>
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="size-8"
              size="icon"
              disabled={!hasNextPage}
            >
              <Link to={nextPageUrl()}>
                <span className="sr-only">Go to next page</span>
                <ChevronRight />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              disabled={!hasNextPage}
            >
              <Link to={lastPageUrl()}>
                <span className="sr-only">Go to last page</span>
                <ChevronsRight />
              </Link>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
