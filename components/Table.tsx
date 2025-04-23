import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  sortConfig?: {
    key: string;
    direction: 'ascending' | 'descending';
  };
  onSort?: (key: string) => void;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  sortConfig,
  onSort,
  className = '',
  emptyMessage = '沒有資料',
  loading = false
}: TableProps<T>) {
  // 獲取排序指示器的類名
  const getClassNamesFor = (name: string) => {
    if (!sortConfig || !onSort) {
      return '';
    }
    return sortConfig.key === name 
      ? `cursor-pointer ${sortConfig.direction === 'ascending' ? 'sort-asc' : 'sort-desc'}`
      : 'cursor-pointer';
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`${column.className || ''} ${column.sortable && onSort ? getClassNamesFor(column.accessor as string) : ''}`}
                onClick={() => {
                  if (column.sortable && onSort) {
                    onSort(column.accessor as string);
                  }
                }}
              >
                {column.header}
                {column.sortable && onSort && (
                  <span className="sort-indicator ml-1">
                    {sortConfig && sortConfig.key === column.accessor ? (
                      sortConfig.direction === 'ascending' ? '↑' : '↓'
                    ) : '↕'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8">
                <div className="flex justify-center items-center">
                  <span className="loading loading-spinner loading-md mr-2"></span>
                  載入中...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={onRowClick ? 'cursor-pointer hover' : ''}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column, index) => (
                  <td key={index} className={column.className || ''}>
                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : item[column.accessor] !== undefined
                      ? String(item[column.accessor])
                      : '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
