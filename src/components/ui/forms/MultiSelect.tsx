import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useOutsideClick } from '../../../hooks/useOutsideClick';

export interface MultiSelectOption {
  id: number | string;
  label: string;
  value: number | string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: (number | string)[];
  onChange: (value: (number | string)[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  label,
  error,
  disabled = false,
  searchable = true,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useOutsideClick(dropdownRef, () => {
    setIsOpen(false);
    setSearchTerm('');
  });

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return options;
    }
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, searchable]);

  // Get selected options for display
  const selectedOptions = useMemo(() => {
    return options.filter(option => value.includes(option.value));
  }, [options, value]);

  // Handle option toggle
  const handleOptionToggle = useCallback((optionValue: number | string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  }, [value, onChange]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const allValues = filteredOptions.map(option => option.value);
    const allSelected = allValues.every(val => value.includes(val));
    
    if (allSelected) {
      // Deselect all filtered options
      const newValue = value.filter(val => !allValues.includes(val));
      onChange(newValue);
    } else {
      // Select all filtered options
      const newValue = [...new Set([...value, ...allValues])];
      onChange(newValue);
    }
  }, [filteredOptions, value, onChange]);

  // Handle chip remove
  const handleChipRemove = useCallback((optionValue: number | string) => {
    const newValue = value.filter(v => v !== optionValue);
    onChange(newValue);
  }, [value, onChange]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  // Handle dropdown toggle
  const handleDropdownToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen && searchable) {
      // Focus search input when opening
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [disabled, isOpen, searchable]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle key down events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  }, []);

  const isAllSelected = filteredOptions.length > 0 && filteredOptions.every(option => value.includes(option.value));
  const isPartiallySelected = filteredOptions.some(option => value.includes(option.value)) && !isAllSelected;

  return (
    <div className={`multiselect-container ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected items display */}
        <div
          className={`
            min-h-[42px] w-full px-3 py-2 border rounded-md cursor-pointer
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
            ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          `}
          onClick={handleDropdownToggle}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {option.label}
                  <button
                    type="button"
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChipRemove(option.value);
                    }}
                    disabled={disabled}
                  >
                    <span className="sr-only">Remove {option.label}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-[1000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-visible flex flex-col max-h-80">
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-gray-200 flex-shrink-0">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            )}

            {/* Select all / Clear all buttons */}
            <div className="flex justify-between p-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                onClick={handleSelectAll}
                disabled={filteredOptions.length === 0}
              >
                {isAllSelected ? 'Deselect All' : isPartiallySelected ? 'Select All' : 'Select All'}
              </button>
              {value.length > 0 && (
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-800 focus:outline-none"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Options list */}
            <div className="overflow-y-auto flex-1 min-h-0">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchTerm ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={`
                        flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100
                        ${isSelected ? 'bg-blue-50' : ''}
                      `}
                      onClick={() => handleOptionToggle(option.value)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent onClick
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className={`ml-2 ${isSelected ? 'font-medium' : ''}`}>
                        {option.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default MultiSelect;
