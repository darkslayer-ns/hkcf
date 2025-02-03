'use client';

import React, { useState, useEffect, useRef } from 'react';
import BoxSearchInput from './BoxHandler/BoxSearchInput';
import BoxCreationForm from './BoxHandler/BoxCreationForm';
import AddMemberForm from './BoxHandler/AddMemberForm';
import SuccessMessage from './BoxHandler/SuccessMessage';

import { searchBoxesMongo } from '@/ssr/db/searchBoxes';

import useDebounce from '@/client/hooks/useDebounce';
import { useGlobal } from '@/app/contexts/GlobalContext';

/**
 * Step constants for different UI states
 */
export const Steps = Object.freeze({
  SEARCH: 'search',            // Step 1: Search for a Box
  ADD_HAILRAISER: 'addHailRaiser', // Step 2: Capture Hell Raiser Name & Email (if no box found)
  CREATE_BOX: 'createBox',      // Step 3: Create a new Box
  JOIN_BOX: 'joinBox',          // Step 4: Add user to existing Box
  SUCCESS: 'success',           // Step 5: Success message after joining or creating
  EXIT: 'exit'                  // Exit if user chooses not to continue
});

/**
 * BoxHandler Component
 * Manages the user flow for searching for a box, joining a box, or creating a new box.
 */
const BoxHandler = ({
  onBoxSelected = (box) => console.log('Box selected:', box),
  onBoxCreated = (box) => console.log('Box created:', box),
  onMemberAdded = (member) => console.log('Member added:', member),
  onExit = () => console.log('User exited workflow'),
}) => {
  const {
    selectedBox, setSelectedBox,
    boxHandlerStep, setBoxHandlerStep
  } = useGlobal();

  // Set default step on mount (using useEffect to avoid updating state during render)
  useEffect(() => {
    setBoxHandlerStep(Steps.SEARCH);
  }, [setBoxHandlerStep]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBoxes, setFilteredBoxes] = useState([]);

  const [hailRaiser, setHailRaiser] = useState({ name: '', email: '' });
  const dropdownRef = useRef(null);

  // Apply debounce to optimize API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const performSearch = async () => {
      const formData = new FormData();
      formData.append('query', debouncedSearchQuery);

      try {
        const result = await searchBoxesMongo(formData);
        setFilteredBoxes(result.googleResults || []);
      } catch (error) {
        console.error('Search error:', error);
        setFilteredBoxes([]);
      }
    };

    if (debouncedSearchQuery.trim().length > 2) {
      performSearch();
    } else {
      setFilteredBoxes([]);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Optional: Close dropdown here if needed
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handles the selection of a box from search results
   */
  const handleBoxSelect = (box) => {
    setSelectedBox(box);
    setSearchQuery(box.name);
    setBoxHandlerStep(Steps.JOIN_BOX);
    onBoxSelected(box);
  };

  /**
   * Handles the case when no matching box is found
   */
  const handleNoBoxFound = () => {
    setBoxHandlerStep(Steps.ADD_HAILRAISER);
  };

  /**
   * Handles capturing the Hell Raiser details before creating a new box
   */
  const handleHailRaiserSubmit = (memberDetails) => {
    setHailRaiser(memberDetails);
    setBoxHandlerStep(Steps.CREATE_BOX);
  };

  /**
   * Handles creating a new box
   */
  const handleCreateBox = (newBox) => {
    onBoxCreated({ ...newBox, members: [hailRaiser] });
    setBoxHandlerStep(Steps.SUCCESS);
  };

  /**
   * Reset to initial state
   */
  const handleReset = () => {
    setBoxHandlerStep(Steps.SEARCH);
    setSearchQuery('');
    setSelectedBox(null);
    setHailRaiser({ name: '', email: '' });
  };

  /**
   * Handles user choosing not to continue
   */
  const handleExit = () => {
    setBoxHandlerStep(Steps.EXIT);
    onExit();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Step 1: Search for a Box */}
      {boxHandlerStep === Steps.SEARCH && (
        <BoxSearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredBoxes={filteredBoxes}
          onBoxSelect={handleBoxSelect}
          onAddNewBox={handleNoBoxFound}
          showCreateOption={debouncedSearchQuery.trim().length > 2 && filteredBoxes.length === 0}
        />
      )}

      {/* Step 2: Add Hell Raiser Name & Email - Shown only if no box found */}
      {boxHandlerStep === Steps.ADD_HAILRAISER && (
        <AddMemberForm
          boxName="New Box"
          onSubmit={handleHailRaiserSubmit}
          onCancel={handleExit}
        />
      )}

      {/* Step 3: Box Creation Form - Shown when no matching box found */}
      {boxHandlerStep === Steps.CREATE_BOX && (
        <BoxCreationForm
          searchQuery={searchQuery}
          onSubmit={handleCreateBox}
          onCancel={handleReset}
        />
      )}

      {/* Step 4: Add Member Form - Shown when existing box selected */}
      {boxHandlerStep === Steps.JOIN_BOX && selectedBox && (
        <AddMemberForm
          boxName={selectedBox.name}
          onSubmit={(memberDetails) => {
            onMemberAdded({ ...memberDetails, box: selectedBox.name });
            setBoxHandlerStep(Steps.SUCCESS);
          }}
          onCancel={handleReset}
        />
      )}

      {/* Step 5: Success Message */}
      {boxHandlerStep === Steps.SUCCESS && (
        <SuccessMessage
          boxName={selectedBox.name}
          onReset={handleReset}
        />
      )}

      {/* Exit Workflow */}
      {boxHandlerStep === Steps.EXIT && (
        <div className="text-center p-4">
          <p>Thank you! Returning to the main page...</p>
        </div>
      )}
    </div>
  );
};

export default BoxHandler;
