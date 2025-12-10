"use client";

import { memo } from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => string | number);
  className?: string | ((row: T) => string);
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function AdminTableComponent<T extends { id: string }>({
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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--voyage-border)]">
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`text-left px-4 py-3 text-sm font-semibold text-[var(--voyage-muted)] whitespace-nowrap ${
                  typeof column.className === "string" ? column.className : ""
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
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-[var(--voyage-border)] hover:bg-[var(--voyage-bg-light)] transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((column, idx) => {
                let cellValue = "";
                try {
                  if (typeof column.accessor === "function") {
                    const result = column.accessor(row);
                    cellValue = result != null ? String(result) : "";
                  } else {
                    cellValue = row[column.accessor] != null ? String(row[column.accessor]) : "";
                  }
                } catch (error) {
                  console.error("Error in accessor:", error);
                  cellValue = "Error";
                }
                
                const cellClassName = typeof column.className === "function"
                  ? column.className(row)
                  : (column.className || "text-white");
                
                return (
                  <td
                    key={idx}
                    className={`text-left px-4 py-3 text-sm break-words ${cellClassName}`}
                  >
                    {cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Memoize with strict comparison to prevent infinite loops
export const AdminTable = memo(AdminTableComponent, (prevProps, nextProps) => {
  if (prevProps.data !== nextProps.data) return false;
  if (prevProps.columns !== nextProps.columns) return false;
  if (prevProps.onRowClick !== nextProps.onRowClick) return false;
  return true;
}) as <T extends { id: string }>(props: AdminTableProps<T>) => JSX.Element;
