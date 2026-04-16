import React from 'react';
import { Search, Plus, Edit, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableLayoutProps {
  title: string;
  columns: Column[];
  data: any[];
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  loadingProgress?: number;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  filterContent?: React.ReactNode;
  hideAdd?: boolean;
  hideEdit?: boolean;
  hideDelete?: boolean;
}

export default function TableLayout({ 
  title, columns, data, onAdd, onEdit, onDelete, onSearch, searchPlaceholder = "Tìm kiếm...",
  isLoading, loadingProgress = 0, onSort, sortKey, sortDirection, currentPage, totalPages, onPageChange, filterContent,
  hideAdd = false, hideEdit = false, hideDelete = false
}: TableLayoutProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-slate-200">
      <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-slate-900">{title}</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {filterContent}
          {onSearch && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                onChange={(e) => onSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          {onAdd && !hideAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm mới
            </button>
          )}
        </div>
      </div>
      <div className={`overflow-x-auto relative rounded-b-lg ${isLoading ? 'min-h-[300px]' : ''}`}>
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="text-blue-600 font-bold text-lg mb-4">Đang tải dữ liệu...</div>
            <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-slate-100 select-none' : ''}`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (!hideEdit || !hideDelete) && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Thao tác</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {!isLoading && data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (!hideEdit || !hideDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && !hideEdit && (
                        <button onClick={() => onEdit(row)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && !hideDelete && (
                        <button onClick={() => onDelete(row)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length + ((onEdit || onDelete) && (!hideEdit || !hideDelete) ? 1 : 0)} className="px-6 py-12 text-center text-slate-500 text-sm">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {!isLoading && totalPages !== undefined && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Trang {currentPage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.((currentPage || 1) - 1)}
              disabled={(currentPage || 1) === 1}
              className="p-1 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <button
              onClick={() => onPageChange?.((currentPage || 1) + 1)}
              disabled={(currentPage || 1) === totalPages}
              className="p-1 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
