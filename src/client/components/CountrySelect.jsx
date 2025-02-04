import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Flag from 'react-world-flags';
import { ChevronDownIcon, Globe } from 'lucide-react';
import countriesData from 'country-json/src/country-by-abbreviation.json';

// Pre-render all flags
const MemoizedFlag = React.memo(({ code }) => (
  <Flag code={code} className="h-6 w-4 mr-2" />
));

// Create maps for instant lookups
const countryMap = new Map();
const flagMap = new Map();
const countryIndexMap = new Map(); // Map first letters to indices

// Pre-compute all data
countriesData.forEach((item, index) => {
  const country = {
    name: item.country,
    code: item.abbreviation,
  };
  countryMap.set(item.abbreviation, country);
  flagMap.set(item.abbreviation, <MemoizedFlag code={item.abbreviation} />);
  
  // Store the first index for each letter
  const firstLetter = country.name.charAt(0).toUpperCase();
  if (!countryIndexMap.has(firstLetter)) {
    countryIndexMap.set(firstLetter, index);
  }
});

const countryList = Array.from(countryMap.values());

// Memoized Country Item Component
const CountryItem = React.memo(({ country, onClick }) => (
  <div
    role="option"
    onClick={onClick}
    className="flex items-center px-4 py-2 hover:bg-gray-800 cursor-pointer text-white h-10"
  >
    {flagMap.get(country.code)}
    <span className="truncate">{country.name}</span>
  </div>
));

// Pre-render all country items
const CountryItems = React.memo(({ onSelect, listRef }) => (
  <>
    {countryList.map((country, index) => (
      <CountryItem
        key={country.code}
        country={country}
        onClick={() => onSelect(country.code)}
      />
    ))}
  </>
));

// Pre-render the dropdown content
const DropdownContent = React.memo(({ onSelect, listRef }) => (
  <div className="absolute w-full mt-1 bg-black border-2 border-gray-800 rounded-lg p-2 z-50 shadow-xl">
    <div 
      ref={listRef}
      className="max-h-60 overflow-y-auto"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <CountryItems onSelect={onSelect} />
    </div>
  </div>
));

const CountrySelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);
  
  const selectedCountry = useMemo(() => 
    value ? countryMap.get(value) : null,
    [value]
  );

  const handleSelect = useCallback((code) => {
    onChange(code);
    setOpen(false);
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyPress = useCallback((event) => {
    if (!open || !listRef.current) return;

    const key = event.key.toUpperCase();
    const index = countryIndexMap.get(key);
    
    if (index !== undefined) {
      const itemHeight = 40; // height of each country item (h-10 = 40px)
      const scrollPosition = index * itemHeight;
      listRef.current.scrollTop = scrollPosition;
    }
  }, [open]);

  // Add keyboard event listener
  useEffect(() => {
    if (open) {
      document.addEventListener('keypress', handleKeyPress);
      return () => document.removeEventListener('keypress', handleKeyPress);
    }
  }, [open, handleKeyPress]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full pl-12 pr-4 py-3 bg-black border-2 border-gray-800 rounded-lg 
                   focus:ring-2 focus:ring-red-600 focus:border-red-600 text-lg flex items-center justify-between 
                   relative"
      >
        <div className="flex items-center">
          <div className="absolute left-4">
            {selectedCountry ? (
              flagMap.get(selectedCountry.code)
            ) : (
              <Globe className="h-6 w-4 mr-2" />
            )}
          </div>
          <span>{selectedCountry ? selectedCountry.name : 'Select Country *'}</span>
        </div>
        <ChevronDownIcon size={20} className="text-gray-500" />
      </button>

      <div className={`${open ? 'block' : 'hidden'}`}>
        <DropdownContent onSelect={handleSelect} listRef={listRef} />
      </div>
    </div>
  );
};

export default React.memo(CountrySelect);