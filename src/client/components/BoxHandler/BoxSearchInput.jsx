import React, { useRef, useEffect } from 'react';
import { Search, MapPin, PlusCircle } from 'lucide-react';

/**
 * BoxSearchInput Component
 * Provides a searchable input field for users to find and select a "box" (gym, fitness center, etc.).
 *
 * @param {Object} props - Component properties.
 * @param {string} props.searchQuery - Current search query value.
 * @param {function} props.setSearchQuery - Function to update the search query.
 * @param {Array} props.filteredBoxes - List of matching boxes based on the search input.
 * @param {function} props.onBoxSelect - Callback function when a box is selected.
 * @param {function} props.onAddNewBox - Callback function to add a new box if not found.
 */
const BoxSearchInput = ({ searchQuery, setSearchQuery, filteredBoxes, onBoxSelect, onAddNewBox }) => {
  const dropdownRef = useRef(null);

  /**
   * Effect: Detects clicks outside the dropdown and clears the search query.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSearchQuery(''); // Clears search query when clicking outside the dropdown
      }
    };

    // Add event listener for detecting clicks outside
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setSearchQuery]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Icon inside the input field */}
      <Search className="absolute left-4 top-4 text-gray-400" size={24} />

      {/* Search Input Field */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Find your box"
        className="w-full pl-14 pr-4 py-4 bg-black/80 backdrop-blur-sm border-2 border-red-600 rounded-lg 
                   text-lg focus:ring-2 focus:ring-red-500 focus:border-red-600 placeholder-gray-400"
      />

      {/* Dropdown appears when the user types at least 3 characters */}
      {searchQuery.trim().length > 2 && (
        <div className="absolute left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm border border-red-600/50 
                        rounded-lg shadow-lg overflow-hidden">
          
          {/* Add New Box Button */}
          <div className="p-4 border-b border-gray-800">
            <button
              onClick={onAddNewBox}
              className="flex items-center space-x-2 text-red-500 hover:text-red-400 transition-colors 
                         group text-lg w-full text-left"
            >
              <PlusCircle size={24} />
              <span>Add your box!</span>
            </button>
          </div>

          {/* Render filtered box list if available */}
          {filteredBoxes.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {filteredBoxes.map((box) => {
                return (
                  <button
                    key={box.id}
                    onClick={() => onBoxSelect(box)}
                    className="w-full px-6 py-4 text-left hover:bg-red-600/20 focus:bg-red-600/20 
                               transition-colors border-b border-gray-800 last:border-0"
                  >
                    <div className="flex items-center">
                      {/* Location Pin Icon */}
                      <MapPin size={20} className="mr-3 text-red-500" />
                      
                      <div>
                        <div className="font-bold text-lg">{box.name}</div>
                        <div className="text-gray-400">{box.location}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Message when no matching boxes are found */
            <div className="p-6 text-gray-400 text-lg">
              No boxes found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BoxSearchInput;
