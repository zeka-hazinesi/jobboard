"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar = memo(function SearchBar({ onSearch, placeholder = "Suche nach Jobs, Unternehmen, oder Kategorien...", className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounced search - only search when user stops typing for 300ms
    debounceTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        onSearch(value.trim());
      } else {
        onSearch("");
      }
    }, 300);
  }, [onSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Memoize icon classes
  const searchIconClass = useMemo(() =>
    `absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
      isActive ? 'text-[#1065bb]' : 'text-gray-400'
    }`,
    [isActive]
  );

  const inputClass = useMemo(() =>
    `w-full pl-10 pr-10 py-3 rounded-lg border-2 transition-all duration-200 font-nunito text-sm ${
      isActive
        ? 'border-[#1065bb] bg-blue-50 text-[#1065bb] placeholder-[#1065bb]/60'
        : 'border-gray-200 bg-white text-gray-700 placeholder-gray-400 hover:border-[#1065bb]/50 focus:border-[#1065bb] focus:bg-blue-50'
    }`,
    [isActive]
  );

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className={searchIconClass} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            placeholder={placeholder}
            className={inputClass}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </form>

      {query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3">
          <p className="text-sm text-gray-600 font-nunito">
            Suche nach: <span className="font-medium text-[#1065bb]">"{query}"</span>
          </p>
        </div>
      )}
    </div>
  );
});
