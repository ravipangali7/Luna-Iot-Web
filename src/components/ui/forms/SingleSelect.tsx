import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useOutsideClick } from '../../../hooks/useOutsideClick';

export interface SingleSelectOption {
  id: number | string;
  label: string;
  value: number | string;
}

export interface SingleSelectProps {
  options: SingleSelectOption[];
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

const SingleSelect: React.FC<SingleSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select option...",
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

  // Get selected option
  const selectedOption = useMemo(() => {
    return options.find(option => option.value === value) || null;
  }, [options, value]);

  // Handle dropdown toggle
  const handleDropdownToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    if (!isOpen && searchable) {
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [disabled, isOpen, searchable]);

  // Handle option selection
  const handleOptionSelect = useCallback((optionValue: number | string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  }, [onChange]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleDropdownToggle();
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  }, [disabled, handleDropdownToggle]);

  // Handle clear selection
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
  }, [onChange, disabled]);

  return (
    <div className={`singleselect-container ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected value display */}
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
          {selectedOption ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-900">{selectedOption.label}</span>
              {!disabled && (
                <button
                  type="button"
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-200 focus:outline-none"
                  onClick={handleClear}
                >
                  <span className="sr-only">Clear selection</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
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

            {/* Options list */}
            <div className="overflow-y-auto flex-1 min-h-0">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchTerm ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <div
                      key={option.value}
                      className={`
                        flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100
                        ${isSelected ? 'bg-blue-50' : ''}
                      `}
                      onClick={() => handleOptionSelect(option.value)}
                    >
                      <div className="flex items-center">
                        {isSelected && (
                          <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={`${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                          {option.label}
                        </span>
                      </div>
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

export default SingleSelect;
