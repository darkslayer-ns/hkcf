import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { searchBoxesGoogle } from '@/ssr/Google/searchBoxes';
import { ChevronRight } from 'lucide-react';

// Importing step components
import EssentialStep from '@/client/components/BoxCreationSteps/EssentialStep';
import ContactInfoStep from '@/client/components/BoxCreationSteps/ContactInfoStep';
import ContactPersonStep from '@/client/components/BoxCreationSteps/ContactPersonStep';

// Importing the progress bar component
import ProgressBar from '@/client/components/UX/ProgressBar';

import useDebounce from '@/client/hooks/useDebounce';
import { useGlobal } from '@/app/contexts/GlobalContext';
import { reqNewBoxSchema } from '@/models/RequestModels';
import { HandlerSteps } from '../BoxHandler';

// Define the available steps as constants for readability
const Steps = Object.freeze({
  ESSENTIAL: 'Box Location',
  CONTACT_INFO: 'Box Contact',
  CONTACT_PERSON: 'Owner Contact',
});

// Define the order of steps in the multi-step form
const stepsList = [Steps.ESSENTIAL, Steps.CONTACT_INFO, Steps.CONTACT_PERSON];

/**
 * Returns the title string corresponding to the provided step.
 *
 * @param {string} step - The current step identifier.
 * @returns {string} The title for the step.
 */
const getStepTitle = (step) => {
  switch (step) {
    case Steps.ESSENTIAL:
      return 'Add New Box';
    case Steps.CONTACT_INFO:
      return 'Add Contact Info';
    case Steps.CONTACT_PERSON:
      return 'Add Contact Person';
    default:
      return '';
  }
};

/**
 * BoxCreationForm component handles a multi-step form process to create a new box.
 *
 * @param {Object} props - Component props.
 * @param {string} props.searchQuery - Initial search query to pre-populate the form.
 * @param {Function} props.onCancel - Function to handle form cancellation.
 * @returns {JSX.Element} The rendered BoxCreationForm component.
 */
const BoxCreationForm = ({ searchQuery, onCancel }) => {
  // Global state setters from context
  const { setSubtitle, setSelectedBox, setBoxHandlerStep } = useGlobal();

  // Local state variables for form step, input changes, suggestions, dropdown visibility, and errors
  const [step, setStep] = useState(Steps.ESSENTIAL);
  const [inputChanged, setInputChanged] = useState(false);
  const [suggestedBoxes, setSuggestedBoxes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');

  // Ref for the dropdown element to detect clicks outside of it
  const dropdownRef = useRef(null);

  // Local state for form data
  const [formData, setFormData] = useState({
    id: '',
    name: searchQuery || '',
    location: '',
    lat: null,
    lng: null,
    rating: null,
    totalRatings: null,
    address: '',
    city: '',
    state: '',
    country: '',
    countryCode: '',
    phone: '',
    website: '',
    contactName: '',
    contactEmail: ''
  });

  // Debounce the name input to reduce the frequency of API calls
  const debouncedName = useDebounce(formData.name, 300);

  /**
   * useEffect to fetch initial box data if a searchQuery is provided.
   * The first result from the API call is selected.
   */
  useEffect(() => {
    if (searchQuery) {
      const fetchBox = async () => {
        const fd = new FormData();
        fd.append('query', searchQuery);
        try {
          const result = await searchBoxesGoogle(fd);
          if (result.googleResults?.length) {
            handleBoxSelect(result.googleResults[0]);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchBox();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  /**
   * useEffect to fetch box suggestions when the debounced name changes.
   * Suggestions are only fetched when the input has been changed and is longer than 2 characters.
   */
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedName.trim().length > 2 && inputChanged) {
        try {
          const fd = new FormData();
          fd.append('query', debouncedName);
          const result = await searchBoxesGoogle(fd);
          setSuggestedBoxes(result.googleResults || []);
          setShowDropdown(result.googleResults?.length > 0);
        } catch (error) {
          console.error('Search error:', error);
          setSuggestedBoxes([]);
          setShowDropdown(false);
        }
      } else {
        setSuggestedBoxes([]);
        setShowDropdown(false);
      }
    };

    fetchSuggestions();
  }, [debouncedName, inputChanged]);

  /**
   * useEffect to add an event listener that closes the dropdown when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Determines if a given field should be editable based on the current step.
   *
   * @param {string} fieldName - The name of the field.
   * @returns {boolean} True if the field is editable, otherwise false.
   */
  const isFieldEditable = useCallback(
    (fieldName) => {
      if (fieldName === 'name') return true;
      return step === Steps.CONTACT_PERSON;
    },
    [step]
  );

  /**
   * Handles changes in form input fields.
   *
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The change event.
   */
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'name') {
      setInputChanged(true);
    }
    setError('');
  }, []);

  /**
   * Updates the form with data from the selected box suggestion.
   *
   * @param {Object} box - The box object selected from suggestions.
   */
  const handleBoxSelect = useCallback((box) => {
    setFormData({ ...box });
    setShowDropdown(false);
    setInputChanged(false);
  }, []);

  /**
   * Validates and submits the form data.
   *
   * @param {React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>} e - The event triggering the submission.
   */
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      // Validate the required fields using the provided schema function
      const validatedData = await reqNewBoxSchema({
        id: formData.id,
        name: formData.name,
        location: formData.location,
        lat: formData.lat,
        lng: formData.lng,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail
      });

      // Update global state with the validated data and mark as successful
      setSelectedBox(validatedData);
      setBoxHandlerStep(HandlerSteps.SUCCESS);
      setSubtitle(null);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Advances the form to the next step.
   */
  const handleNext = () => {
    const currentIndex = stepsList.indexOf(step);
    const nextStep = stepsList[currentIndex + 1];
    setError('');
    setStep(nextStep);
  };

  /**
   * Returns the form to the previous step.
   */
  const handleBack = () => {
    const currentIndex = stepsList.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepsList[currentIndex - 1]);
    }
    setError('');
  };

  /**
   * Renders the content for the current form step.
   *
   * @returns {JSX.Element|null} The step component corresponding to the current step.
   */
  const stepContent = useMemo(() => {
    switch (step) {
      case Steps.ESSENTIAL:
        return (
          <EssentialStep
            formData={formData}
            handleInputChange={handleInputChange}
            showDropdown={showDropdown}
            suggestedBoxes={suggestedBoxes}
            handleBoxSelect={handleBoxSelect}
            setShowDropdown={setShowDropdown}
            dropdownRef={dropdownRef}
            isFieldEditable={isFieldEditable}
          />
        );
      case Steps.CONTACT_INFO:
        return (
          <ContactInfoStep
            formData={formData}
            handleInputChange={handleInputChange}
            isFieldEditable={isFieldEditable}
          />
        );
      case Steps.CONTACT_PERSON:
        return (
          <ContactPersonStep
            formData={formData}
            handleInputChange={handleInputChange}
            isFieldEditable={isFieldEditable}
          />
        );
      default:
        return null;
    }
  }, [
    step,
    formData,
    handleInputChange,
    showDropdown,
    suggestedBoxes,
    handleBoxSelect,
    isFieldEditable,
    setShowDropdown,
    dropdownRef
  ]);

  return (
    <div
      className="max-w-2xl mx-auto mt-4 backdrop-blur-sm border-2 border-red-600/50 rounded-lg p-4 sm:p-6 lg:p-8 relative"
      ref={dropdownRef}
    >
      <form className="space-y-8">
        {/* Display the step title */}
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-center">
          {getStepTitle(step)}
        </h2>

        {/* Render progress bar with the current step */}
        <ProgressBar currentStep={step} steps={Steps} />

        {/* Render the content of the current step */}
        <div className="grid grid-cols-1 gap-6">{stepContent}</div>

        {/* Display any error messages */}
        {error && (
          <div className="text-red-500 text-sm font-medium text-center">{error}</div>
        )}

        {/* Render navigation buttons based on the current step */}
        {(() => {
          switch (step) {
            case Steps.ESSENTIAL:
              return (
                <>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 text-base sm:text-lg font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-red-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-red-500 transition-colors inline-flex items-center"
                  >
                    Next
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </button>
                </>
              );
            case Steps.CONTACT_INFO:
              return (
                <>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 text-base sm:text-lg font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-red-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-red-500 transition-colors inline-flex items-center"
                  >
                    Next
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </button>
                </>
              );
            case Steps.CONTACT_PERSON:
              return (
                <>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 text-base sm:text-lg font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-red-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-red-500 transition-colors"
                  >
                    Create Box
                  </button>
                </>
              );
            default:
              return null;
          }
        })()}
      </form>
    </div>
  );
};

export default BoxCreationForm;
