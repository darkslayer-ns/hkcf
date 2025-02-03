import React, { useState, useEffect, useRef } from 'react';
import { searchBoxesGoogle } from '@/ssr/Google/searchBoxes';
import { MapPin, PlusCircle, ChevronRight } from 'lucide-react';
import Flag from 'react-world-flags';
import useDebounce from '@/client/hooks/useDebounce';
import ProgressBar from '@/client/components/UX/ProgressBar';

import { useGlobal } from '@/app/contexts/GlobalContext';
import { reqNewBoxSchema } from '@/models/RequestModels';

// Fields that users are allowed to edit manually
const editableFields = ['name', 'phone', 'website', 'contactName', 'contactEmail', 'address'];

// Define the steps for the multi‑step form including a final success step.
const Steps = Object.freeze({
  ESSENTIAL: 'Box Location',
  CONTACT_INFO: 'Box Contact',
  CONTACT_PERSON: 'Owner Contact',
});

const stepsList = [Steps.ESSENTIAL, Steps.CONTACT_INFO, Steps.CONTACT_PERSON];

// Returns a title for the current step (can be customized further)
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

const BoxCreationForm = ({ searchQuery, onSubmit, onCancel }) => {
  const { setTitle, setSubtitle, hellRaiser } = useGlobal();
  const [step, setStep] = useState(Steps.ESSENTIAL);
  const [inputChanged, setInputChanged] = useState(false);
  const [suggestedBoxes, setSuggestedBoxes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  // Our complete form data – when a box is selected the fields are populated
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


  // Debounce the name field to reduce unnecessary API calls.
  const debouncedName = useDebounce(formData.name, 300);

  // If searchQuery is passed in, auto‑search and select the first result.
  useEffect(() => {
    if (searchQuery) {
      const fd = new FormData();
      fd.append('query', searchQuery);
      searchBoxesGoogle(fd)
        .then(result => {
          if (result.googleResults?.length) {
            handleBoxSelect(result.googleResults[0]);
          }
        })
        .catch(err => console.error(err));
    }
  }, [searchQuery]);

  // Fetch suggestions when the debounced name changes.
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

  // Hide the suggestions dropdown if the user clicks outside of it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update formData for allowed editable fields.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (!editableFields.includes(name)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'name') {
      setInputChanged(true);
    }
    setError('');
  };

  // When a suggested box is selected, populate the formData.
  const handleBoxSelect = (box) => {
    console.log('Selected box:', box); // For debugging purposes.
    setFormData({
      ...box,
      contactName: '', // Didn't see those being sent by Google (individual contact?)
      contactEmail: ''  // Didn't see those being sent by Google (individual contact?)
    });
    setShowDropdown(false);
    setInputChanged(false);
  };

  // Validate the data and then submit it.
  const handleFormSubmit = async (data) => {
    try {
      // Validate the data using your schema.
      const validatedData = await reqNewBoxSchema({
        id: data.id,
        name: data.name,
        location: data.location,
        lat: data.lat,
        lng: data.lng,
        city: data.city,
        state: data.state,
        country: data.country,
        contactName: data.contactName,
        contactEmail: data.contactEmail || null
      });

      const boxData = {
        boxDetails: {
          id: validatedData.id,
          name: validatedData.name,
          location: validatedData.location,
          coordinates: {
            lat: validatedData.lat,
            lng: validatedData.lng
          },
          city: validatedData.city,
          state: validatedData.state,
          country: validatedData.country,
          rating: data.rating,
          totalRatings: data.totalRatings
        },
        contactInfo: {
          phone: data.phone,
          website: data.website
        },
        owner: {
          name: validatedData.contactName,
          email: validatedData.contactEmail
        }
      };

      await onSubmit(boxData);
      setSubtitle(null);
      setStep(Steps.SUCCESS);
    } catch (error) {
      setError(error.message);
    }
  };

  // Move to the next step (with a validation check on the first step).
  const handleNext = () => {
    const currentIndex = stepsList.indexOf(step);
    const nextStep = stepsList[currentIndex + 1];

    // On the first step, ensure an address is selected or entered.
    if (step === Steps.ESSENTIAL && !formData.address) {
      setError('Please select a box from the search results or enter an address.');
      return;
    }
    setError('');
    setStep(nextStep);
  };

  // Move to the previous step.
  const handleBack = () => {
    const currentIndex = stepsList.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepsList[currentIndex - 1]);
    }
    setError('');
  };

  // When the form is submitted, if on the last data‑entry step then submit.
  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === Steps.CONTACT_PERSON) {
      if (formData.contactEmail && !formData.contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError('Please enter a valid email address');
        return;
      }
      handleFormSubmit(formData);
    }
  };

  // Render the current step's content.
  const renderStepContent = () => {
    switch (step) {
      case Steps.ESSENTIAL:
        return (
          <>
            <div className="relative">
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">
                Box Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 text-base sm:text-lg"
                placeholder="Enter box name to search..."
              />
              {showDropdown && (
                <div className="absolute left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm border border-red-600/50 rounded-lg shadow-lg overflow-hidden z-50">
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
                            <div className="text-sm text-gray-400">{box.address || box.location}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">
                Address
              </label>
              <div className="relative flex items-center">
                <Flag code={formData.countryCode || 'US'} className="h-6 w-4 absolute left-3" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg text-base sm:text-lg"
                  placeholder="Full address"
                />
              </div>
            </div>
          </>
        );

      case Steps.CONTACT_INFO:
        return (
          <>
            <div>
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg text-base sm:text-lg"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg text-base sm:text-lg"
              />
            </div>
          </>
        );

      case Steps.CONTACT_PERSON:
        return (
          <>
            <div>
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">
                Contact Name
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg text-base sm:text-lg"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">
                Contact Email <span className="text-gray-400 text-sm ml-2">(Optional)</span>
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg text-base sm:text-lg"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="max-w-2xl mx-auto mt-4 backdrop-blur-sm border-2 border-red-600/50 rounded-lg p-4 sm:p-6 lg:p-8 relative"
      ref={dropdownRef}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-center">
          {getStepTitle(step)}
        </h2>

        <ProgressBar currentStep={step} steps={Steps} />

        <div className="grid grid-cols-1 gap-6">{renderStepContent()}</div>

        {error && (
          <div className="text-red-500 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-800">
          {step !== Steps.ESSENTIAL && step !== Steps.SUCCESS && (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3 text-base sm:text-lg font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Back
            </button>
          )}

          {step === Steps.ESSENTIAL && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-base sm:text-lg font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}

          {step === Steps.SUCCESS ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-red-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-red-500 transition-colors"
            >
              Done
            </button>
          ) : step === Steps.CONTACT_PERSON ? (
            <button
              type="submit"
              className="px-6 py-3 bg-red-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-red-500 transition-colors"
            >
              Create Box
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-red-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-red-500 transition-colors inline-flex items-center"
            >
              Next
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BoxCreationForm;
