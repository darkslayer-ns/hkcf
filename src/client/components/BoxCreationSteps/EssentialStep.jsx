import React from 'react';
import { MapPin, PlusCircle } from 'lucide-react';
import Flag from 'react-world-flags';

// Common input styling class
const inputClass =
  "w-full px-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg text-base sm:text-lg";

/**
 * EssentialStep Component
 * A form component for box creation with search and selection functionality
 * 
 * @param {Object} props
 * @param {Object} props.formData - Contains form field values (name, address, countryCode)
 * @param {Function} props.handleInputChange - Handler for input field changes
 * @param {boolean} props.showDropdown - Controls visibility of search results dropdown
 * @param {Array} props.suggestedBoxes - Array of box suggestions from search
 * @param {Function} props.handleBoxSelect - Handler for when a box is selected from suggestions
 * @param {Function} props.setShowDropdown - Controls dropdown visibility state
 * @param {Function} props.isFieldEditable - Determines if a field can be edited
 */
const EssentialStep = ({
  formData,
  handleInputChange,
  showDropdown,
  suggestedBoxes,
  handleBoxSelect,
  setShowDropdown,
  isFieldEditable,
}) => (
  <>
    {/* Box Name Search Section */}
    <div className="relative">
      <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">
        Box Name *
      </label>
      {/* Search Input Field */}
      <input
        type="text"
        name="name"
        required
        value={formData.name}
        onChange={handleInputChange}
        disabled={false}
        className={`${inputClass} focus:ring-2 focus:ring-red-600 focus:border-red-600`}
        placeholder="Enter box name to search..."
      />

      {/* Dropdown for Search Results */}
      {showDropdown && (
        <div className="absolute left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm border border-red-600/50 rounded-lg shadow-lg overflow-hidden z-50">
          {/* Create New Box Option */}
          <div className="p-3 border-b border-gray-800">
            <button
              type="button"
              onClick={() => setShowDropdown(false)}
              className="flex items-center space-x-2 text-red-500 hover:text-red-400 transition-colors group text-base sm:text-lg w-full text-left"
            >
              <PlusCircle size={20} />
              <span>Create new box</span>
            </button>
          </div>

          {/* Suggested Boxes List */}
          <div className="max-h-60 overflow-y-auto">
            {suggestedBoxes.map((box) => (
              <button
                key={box.id}
                type="button"
                onClick={() => handleBoxSelect(box)}
                className="w-full px-4 py-3 text-left hover:bg-red-600/20 focus:bg-red-600/20 transition-colors border-b border-gray-800 last:border-0"
              >
                <div className="flex items-center">
                  <MapPin size={18} className="shrink-0 mr-3 text-red-500" />
                  <div>
                    <div className="font-bold text-base sm:text-lg">{box.name}</div>
                    <div className="text-sm text-gray-400">
                      {box.address || box.location}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Address Input Section */}
    <div>
      <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">
        Address
      </label>
      <div className="relative flex items-center">
        {/* Country Flag Icon */}
        <Flag code={formData.countryCode || 'US'} className="h-6 w-4 absolute left-3" />
        {/* Address Input Field */}
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          disabled={!isFieldEditable('address')}
          className={`${inputClass} pl-12`}
          placeholder="Full address"
        />
      </div>
    </div>
  </>
);

export default EssentialStep;