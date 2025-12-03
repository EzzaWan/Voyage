"use client";

import { ReactNode } from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function AdminTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = "No data available",
}: AdminTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--voyage-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <table className="w-full border-collapse table-auto">
        <thead>
          <tr className="border-b border-[var(--voyage-border)]">
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`text-left px-6 py-4 text-sm font-semibold text-[var(--voyage-muted)] ${
                  column.className || ""
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-[var(--voyage-border)] hover:bg-[var(--voyage-bg-light)] transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((column, idx) => (
                <td
                  key={idx}
                  className={`px-6 py-4 text-sm text-white break-words ${
                    column.className || ""
                  }`}
                >
                  {typeof column.accessor === "function"
                    ? column.accessor(row)
                    : String(row[column.accessor] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
  );
}

