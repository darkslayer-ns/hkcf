'use client';

// React and core dependencies
import React, { useState, useEffect, useRef, Component } from 'react';

// Local components
import BoxSearchInput from './BoxHandler/BoxSearchInput';
import BoxCreationForm from './BoxHandler/BoxCreationForm';
import AddMemberForm from './BoxHandler/AddMemberForm';
import SuccessMessage from './BoxHandler/SuccessMessage';

// Server actions
import { searchBoxes } from '@/ssr/db/searchBoxes';
import { addHailraiser } from '@/ssr/db/actions';

// Hooks and context
import useDebounce from '@/client/hooks/useDebounce';
import { useGlobal } from '@/app/contexts/GlobalContext';

/**
 * Error Boundary component to handle errors in the component tree
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('BoxHandler error:', error, errorInfo);
    // Reset error state after 5 seconds
    setTimeout(() => {
      if (this.state.hasError) {
        this.setState({ hasError: false, error: null });
      }
    }, 5000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500 bg-red-100/10 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-sm text-red-400 mb-2">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <p className="text-xs text-red-400/80 mb-4">
            Please try again. If the problem persists, refresh the page.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500/10 transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Step constants for different UI states
 */
export const HandlerSteps = Object.freeze({
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
const BoxHandlerContent = ({
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
    setBoxHandlerStep(HandlerSteps.SEARCH);
  }, [setBoxHandlerStep]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBoxes, setFilteredBoxes] = useState([]);

  const [hailRaiser, setHailRaiser] = useState({ name: '', email: '' });
  const dropdownRef = useRef(null);

  // Apply debounce to optimize API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Reset error state when query changes
  useEffect(() => {
    setSearchError(null);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout;

    const performSearch = async (attempt = 0) => {
      try {
        if (!isMounted) return;
        setIsSearching(true);
        setSearchError(null);

        // Call the server action
        const result = await searchBoxes({ query: debouncedSearchQuery });
        
        if (!isMounted) return;

        if (!result) {
          throw new Error('No response received from search');
        }

        if (result.error) {
          setFilteredBoxes([]);
          setSearchError(
            typeof result.error === 'string' 
              ? result.error 
              : 'Failed to search boxes'
          );
          return;
        }

        const searchResults = result.results || [];
        setFilteredBoxes(searchResults);
      } catch (error) {
        if (!isMounted) return;
        console.error('Search error:', error);
        setFilteredBoxes([]);

        // Retry logic for network or timeout errors
        const isRetryableError = 
          error.message?.toLowerCase().includes('network') ||
          error.message?.toLowerCase().includes('timeout') ||
          error.message?.toLowerCase().includes('failed to fetch');

        if (attempt < 2 && isRetryableError) {
          const retryDelay = 1000 * Math.pow(2, attempt); // Exponential backoff: 1s, 2s
          setSearchError(
            `Connection issue. Retrying in ${retryDelay/1000} second${retryDelay > 1000 ? 's' : ''} ` +
            `(attempt ${attempt + 1} of 2)...`
          );
          retryTimeout = setTimeout(() => {
            if (isMounted) {
              performSearch(attempt + 1);
            }
          }, retryDelay);
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const friendlyError = isRetryableError
          ? 'Unable to connect to the server. Please check your connection and try again.'
          : errorMessage.toLowerCase().includes('invalid') 
            ? 'Please enter a valid search query'
            : 'An unexpected error occurred while searching';

        setSearchError(friendlyError);
      } finally {
        if (isMounted) {
          setIsSearching(false);
          setRetryCount(0);
        }
      }
    };

    const debouncedQuery = debouncedSearchQuery.trim();
    if (debouncedQuery.length > 2) {
      performSearch();
    } else {
      setFilteredBoxes([]);
      setSearchError(null);
      setIsSearching(false);
    }

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
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
    setBoxHandlerStep(HandlerSteps.ADD_HAILRAISER);
    onBoxSelected(box);
  };

  /**
   * Handles the case when no matching box is found
   */
  const handleNoBoxFound = () => {
    setBoxHandlerStep(HandlerSteps.ADD_HAILRAISER);
  };

  /**
   * Handles capturing the Hell Raiser details before creating a new box
   */
  const handleHailRaiserSubmit = async (memberDetails) => {
    // memberDetails contains validated data from AddMemberForm including submissionType
    setHailRaiser(memberDetails);
    setSearchError(null);

    if (selectedBox) {
      try {
        await onMemberAdded({
          ...memberDetails,
          box: selectedBox.name,
          boxId: selectedBox.id
        });
        setBoxHandlerStep(HandlerSteps.SUCCESS);
      } catch (error) {
        console.error('Failed to add hailraiser:', error);
        setSearchError('Failed to add member to ' + selectedBox.name + '. Please check your details and try again.');
        setBoxHandlerStep(HandlerSteps.ADD_HAILRAISER);
      }
    } else {
      // If no box selected, proceed to create box step
      setBoxHandlerStep(HandlerSteps.CREATE_BOX);
    }
  };

  /**
   * Handles creating a new box
   */
  const handleCreateBox = async (newBox) => {
    setSearchError(null);
    try {
      // Create the box first
      const createdBox = await onBoxCreated(newBox);
      
      // Then add the hailraiser to the created box
      await addHailraiser({
        ...hailRaiser,
        box: createdBox.name,
        boxId: createdBox.id
      });
      
      setBoxHandlerStep(HandlerSteps.SUCCESS);
    } catch (error) {
      console.error('Failed to create box:', error);
      setSearchError('Failed to create box. Please check your details and try again.');
      setBoxHandlerStep(HandlerSteps.CREATE_BOX);
    }
  };

  /**
   * Reset to initial state
   */
  const handleReset = () => {
    setBoxHandlerStep(HandlerSteps.SEARCH);
    setSearchQuery('');
    setSelectedBox(null);
    setHailRaiser({ name: '', email: '' });
  };

  /**
   * Handles user choosing not to continue
   */
  const handleExit = () => {
    setBoxHandlerStep(HandlerSteps.EXIT);
    onExit();
  };

  // When in EXIT state, return to SEARCH step after 5 seconds.
  useEffect(() => {
    if (boxHandlerStep === HandlerSteps.EXIT) {
      const timer = setTimeout(() => {
        handleReset();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [boxHandlerStep]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Step 1: Search for a Box */}
      {boxHandlerStep === HandlerSteps.SEARCH && (
        <BoxSearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredBoxes={filteredBoxes}
          onBoxSelect={handleBoxSelect}
          onAddNewBox={handleNoBoxFound}
          showCreateOption={
            !isSearching && 
            !searchError && 
            debouncedSearchQuery.trim().length > 2 && 
            filteredBoxes.length === 0
          }
          isLoading={isSearching}
          error={searchError}
        />
      )}

      {/* Step 2: Add Hell Raiser Name & Email */}
      {boxHandlerStep === HandlerSteps.ADD_HAILRAISER && (
        <AddMemberForm
          boxId={selectedBox ? selectedBox.id : null}
          onSubmit={handleHailRaiserSubmit}
          onCancel={boxHandlerStep === HandlerSteps.ADD_HAILRAISER ? handleExit : handleReset}
        />
      )}

      {/* Step 3: Box Creation Form - Only shown when no box was selected */}
      {boxHandlerStep === HandlerSteps.CREATE_BOX && !selectedBox && (
        <BoxCreationForm
          searchQuery={searchQuery}
          onSubmit={handleCreateBox}
          onCancel={handleReset}
        />
      )}

      {/* Step 5: Success Message */}
      {boxHandlerStep === HandlerSteps.SUCCESS && (
        <SuccessMessage
          boxName={selectedBox.name}
          onReset={handleReset}
        />
      )}

      {/* Exit Workflow */}
      {boxHandlerStep === HandlerSteps.EXIT && (
        <div className="text-center p-4">
          <p>Thank you! Returning to the main page...</p>
        </div>
      )}
    </div>
  );
};

const BoxHandler = (props) => (
  <ErrorBoundary>
    <BoxHandlerContent {...props} />
  </ErrorBoundary>
);

export default BoxHandler;
