import React from 'react';
import FormSelect from './FormSelect';

interface FilterOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface FilterSortBarProps {
  filterOptions: FilterOption[];
  sortOptions: SortOption[];
  currentFilter: string;
  currentSort: string;
  onFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  searchValue?: string;
}

export default function FilterSortBar({
  filterOptions,
  sortOptions,
  currentFilter,
  currentSort,
  onFilterChange,
  onSortChange,
  searchPlaceholder = '搜尋...',
  onSearch,
  searchValue = ''
}: FilterSortBarProps) {
  return (
    <div className="filter-sort-bar bg-base-100 p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <FormSelect
            id="filter"
            label="篩選"
            options={filterOptions}
            value={currentFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="mb-0"
          />
        </div>
        <div className="flex-1">
          <FormSelect
            id="sort"
            label="排序"
            options={sortOptions}
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="mb-0"
          />
        </div>
        {onSearch && (
          <div className="flex-1">
            <label className="label">
              <span className="label-text">搜尋</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="input input-bordered w-full pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
