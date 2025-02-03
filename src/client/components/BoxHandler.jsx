'use client';

import React, { useState, useEffect, useRef } from 'react';
import BoxSearchInput from './BoxHandler/BoxSearchInput';
import BoxCreationForm from './BoxHandler/BoxCreationForm';
import AddMemberForm from './BoxHandler/AddMemberForm';
import SuccessMessage from './BoxHandler/SuccessMessage';

import { searchBoxesMongo } from '@/ssr/db/searchBoxes'
import useDebounce from '@/client/hooks/useDebounce';

/**
 * Step constants for different UI states
 */
const Steps = Object.freeze({
  INITIAL: 'initial', // Search input field
  ADD_NEW_BOX: 'addNewBox', // Box creation form
  ADD_ME: 'addMe', // Add user to existing box
  SUCCESS: 'success', // Success message after joining
});

/**
 * BoxHandler Component
 * Manages the user flow for searching, creating, and joining a box.
 *
 * @param {Object} props - Component properties.
 * @param {function} props.onBoxSelected - Callback when a box is selected.
 * @param {function} props.onBoxCreated - Callback when a new box is created.
 * @param {function} props.onMemberAdded - Callback when a user joins a box.
 */
const BoxHandler = ({
  onBoxSelected = (box) => console.log('Box selected:', box),
  onBoxCreated = (box) => console.log('Box created:', box),
  onMemberAdded = (member) => console.log('Member added:', member),
}) => {
  const [step, setStep] = useState(Steps.INITIAL); // Tracks the current UI step
  const [searchQuery, setSearchQuery] = useState(''); // Stores the user's search query
  const [filteredBoxes, setFilteredBoxes] = useState([]); // Stores search results
  const [selectedBox, setSelectedBox] = useState(null); // Stores the selected box
  const dropdownRef = useRef(null); // Ref for dropdown handling

  // Apply debounce before triggering search to optimize API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  /**
   * Effect: Triggers search when the debounced query changes.
   * Ensures search is performed only when the user stops typing for 300ms.
   */
  useEffect(() => {
    const performSearch = async () => {
      const formData = new FormData();
      formData.append('query', debouncedSearchQuery);

      try {
        const result = await searchBoxesMongo(formData);
        setFilteredBoxes(result.googleResults || [])
      } catch (error) {
        console.error('Search error:', error);
        setFilteredBoxes([]); // Clears results on error
      }
    };

    // Only search if the query is at least 3 characters long
    if (debouncedSearchQuery.trim().length > 2) {
      performSearch();
    } else {
      setFilteredBoxes([]);
    }
  }, [debouncedSearchQuery]);

  /**
   * Effect: Closes the dropdown when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Optionally, close the dropdown here if needed
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handles box selection.
   * @param {Object} box - The selected box object.
   */
  const handleBoxSelect = (box) => {
    setSelectedBox(box);
    setSearchQuery(box.name);
    setStep(Steps.ADD_ME);
    onBoxSelected(box); 
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Box Input */}
      {step === Steps.INITIAL && (
        <BoxSearchInput
          searchQuery={searchQuery}
          setSearchQuery={(query) => {
            setSearchQuery(query);
            setStep(Steps.INITIAL); // Reset to search state
          }}
          filteredBoxes={filteredBoxes}
          onBoxSelect={handleBoxSelect}
          onAddNewBox={() => setStep(Steps.ADD_NEW_BOX)}
        />
      )}

      {/* Box Creation Form */}
      {step === Steps.ADD_NEW_BOX && (
        <BoxCreationForm
          searchQuery={searchQuery}
          onSubmit={() => {}}
          onCancel={() => setStep(Steps.INITIAL)}
        />
      )}

      {/* Add Member Form (when selecting an existing box) */}
      {step === Steps.ADD_ME && selectedBox && (
        <AddMemberForm
          boxName={selectedBox.name}
          onSubmit={() => {}}
          onCancel={() => setStep(Steps.INITIAL)}
        />
      )}

      {/* Success Message after joining a box */}
      {step === Steps.SUCCESS && selectedBox && (
        <SuccessMessage boxName={selectedBox.name} onReset={() => setStep(Steps.INITIAL)} />
      )}
    </div>
  );
};

export default BoxHandler;
