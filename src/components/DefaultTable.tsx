import { ReactNode, useMemo, useState } from "react";

export type TableSortDirection = "asc" | "desc";

export interface DefaultTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
}

interface DefaultTableProps<T> {
  rows: T[];
  columns: DefaultTableColumn<T>[];
  getRowId: (row: T) => string | number;
  getSearchText: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage: string;
  pageSize?: number;
  searchPlaceholder?: string;
  addButtonLabel?: string;
  onAdd?: () => void;
}

export function DefaultTable<T>({
  rows,
  columns,
  getRowId,
  getSearchText,
  onRowClick,
  emptyMessage,
  pageSize = 6,
  searchPlaceholder = "Buscar...",
  addButtonLabel = "Agregar",
  onAdd,
}: DefaultTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<TableSortDirection>("asc");
  const [page, setPage] = useState(1);

  const visibleRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    let nextRows = rows;
    if (normalizedQuery) {
      nextRows = rows.filter((row) =>
        getSearchText(row).toLowerCase().includes(normalizedQuery),
      );
    }

    if (!sortKey) {
      return nextRows;
    }

    const targetColumn = columns.find((column) => column.key === sortKey);
    if (!targetColumn || !targetColumn.sortable || !targetColumn.sortValue) {
      return nextRows;
    }

    return [...nextRows].sort((left, right) => {
      const leftValue = targetColumn.sortValue?.(left);
      const rightValue = targetColumn.sortValue?.(right);

      const numericLeft = Number(leftValue);
      const numericRight = Number(rightValue);
      let compare = 0;

      if (Number.isFinite(numericLeft) && Number.isFinite(numericRight)) {
        compare = numericLeft - numericRight;
      } else {
        compare = String(leftValue ?? "").localeCompare(
          String(rightValue ?? ""),
          "es",
          {
            sensitivity: "base",
          },
        );
      }

      return sortDirection === "asc" ? compare : -compare;
    });
  }, [rows, searchQuery, sortKey, sortDirection, columns, getSearchText]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const onSort = (column: DefaultTableColumn<T>) => {
    if (!column.sortable) return;

    setPage(1);
    setSortKey((prevKey) => {
      if (prevKey === column.key) {
        setSortDirection((prevDirection) =>
          prevDirection === "asc" ? "desc" : "asc",
        );
        return prevKey;
      }

      setSortDirection("asc");
      return column.key;
    });
  };

  return (
    <div className="default-table-container">
      <div className="default-table-toolbar">
        <div className="default-table-search-row">
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
          />
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setSearchQuery("");
              setPage(1);
            }}
            disabled={!searchQuery}
          >
            Limpiar
          </button>
        </div>
        {onAdd && (
          <button type="button" onClick={onAdd}>
            {addButtonLabel}
          </button>
        )}
      </div>

      {visibleRows.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <>
          <div className="standard-table-wrap">
            <table className="standard-table">
              <thead>
                <tr>
                  {columns.map((column) => {
                    const activeSort = sortKey === column.key;

                    return (
                      <th key={column.key}>
                        {column.sortable ? (
                          <button
                            type="button"
                            className={`table-sort-button ${activeSort ? "active" : ""}`}
                            onClick={() => onSort(column)}
                          >
                            {column.label}
                            <span className="sort-indicator">
                              {activeSort
                                ? sortDirection === "asc"
                                  ? "↑"
                                  : "↓"
                                : "↕"}
                            </span>
                          </button>
                        ) : (
                          <span>{column.label}</span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => {
                  const isClickable = Boolean(onRowClick);

                  return (
                    <tr
                      key={getRowId(row)}
                      className={isClickable ? "table-clickable-row" : undefined}
                      onClick={isClickable ? () => onRowClick?.(row) : undefined}
                      onKeyDown={
                        isClickable
                          ? (event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onRowClick?.(row);
                              }
                            }
                          : undefined
                      }
                      tabIndex={isClickable ? 0 : undefined}
                    >
                      {columns.map((column) => (
                        <td key={column.key}>{column.render(row)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </button>
            <span>
              Pagina {safePage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
