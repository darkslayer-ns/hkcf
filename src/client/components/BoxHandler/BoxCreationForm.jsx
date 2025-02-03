import React, { useState, useEffect, useRef } from 'react';
import { searchBoxesGoogle } from '@/ssr/Google/searchBoxes';
import { MapPin, PlusCircle, ChevronRight } from 'lucide-react';

import Flag from 'react-world-flags';

import useDebounce from '@/client/hooks/useDebounce';
import ProgressBar from '@/client/components/UX/ProgressBar';

/* Import global context handler */
import { useGlobal } from '@/app/contexts/GlobalContext';

/**
 * Step constants for different UI states
 */
const Steps = Object.freeze({
  ESSENTIAL: 'Box Location',     // Box name and address
  CONTACT_INFO: 'Box Contact',    // Phone and website
  CONTACT_PERSON: 'Owner Contact',   // Contact name and email
});

const BoxCreationForm = ({ searchQuery, onSubmit, onCancel }) => {
  const { setTitle, setSubtitle } = useGlobal();

  const [step, setStep] = useState(Steps.ESSENTIAL);
  const [boxName, setBoxName] = useState(searchQuery || '');
  const [suggestedBoxes, setSuggestedBoxes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputChanged, setInputChanged] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    countryCode: 'US',
    phone: '',
    website: '',
    contactName: '',
    contactEmail: ''
  });

  const debouncedBoxName = useDebounce(boxName, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedBoxName.trim().length > 2 && inputChanged) {
        try {
          const formData = new FormData();
          formData.append('query', debouncedBoxName);
          const result = await searchBoxesGoogle(formData);
          setSuggestedBoxes(result.googleResults || []);
          setShowDropdown(result.googleResults.length > 0);
        } catch (error) {
          console.error('Search error:', error);
          setSuggestedBoxes([]);
        }
      } else {
        setSuggestedBoxes([]);
        setShowDropdown(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedBoxName, inputChanged]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add validation here if needed
    const submitData = {
      ...formData,
      name: boxName // Ensure we're sending the box name from the search
    };
    onSubmit(submitData);
  };

  const handleNext = () => {
    if (step === Steps.ESSENTIAL) setStep(Steps.CONTACT_INFO);
    else if (step === Steps.CONTACT_INFO) setStep(Steps.CONTACT_PERSON);
  };

  const handleBack = () => {
    if (step === Steps.CONTACT_PERSON) setStep(Steps.CONTACT_INFO);
    else if (step === Steps.CONTACT_INFO) setStep(Steps.ESSENTIAL);
  };

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
                name="boxName"
                required
                value={boxName}
                onChange={(e) => {
                  setBoxName(e.target.value);
                  setInputChanged(true);
                }}
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
                      <PlusCircle className="shrink-0" size={20} />
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {suggestedBoxes.map((box) => (
                      <button
                        key={box.id}
                        type="button"
                        onClick={() => {
                          setBoxName(box.name);
                          setFormData({
                            name: box.name,
                            address: box.address || '',
                            countryCode: box.country_code || 'US',
                            phone: box.phone || '',
                            website: box.website || '',
                            contactName: '',
                            contactEmail: ''
                          });
                          setShowDropdown(false);
                          setInputChanged(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-red-600/20 focus:bg-red-600/20 transition-colors border-b border-gray-800 last:border-0"
                      >
                        <div className="flex items-center">
                          <MapPin size={18} className="shrink-0 mr-3 text-red-500" />
                          <div>
                            <div className="font-bold text-base sm:text-lg">{box.name}</div>
                            <div className="text-sm text-gray-400">{box.address}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">Address</label>
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
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">Phone</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg text-base sm:text-lg" 
              />
            </div>
            
            <div>
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">Website</label>
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
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">Contact Name</label>
              <input 
                type="text" 
                name="contactName" 
                value={formData.contactName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg text-base sm:text-lg" 
              />
            </div>

            <div>
              <label className="block text-base sm:text-lg font-bold uppercase tracking-wider mb-2">Contact Email</label>
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
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case Steps.ESSENTIAL:
        return "Add New Box";
      case Steps.CONTACT_INFO:
        return "Add Contact Info";
      case Steps.CONTACT_PERSON:
        return "Add Contact Person";
      default:
        return "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-4 backdrop-blur-sm border-2 border-red-600/50 rounded-lg p-4 sm:p-6 lg:p-8 relative" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-center">
          {getStepTitle()}
        </h2>

        {/* ProgressBar Component */}
        <ProgressBar currentStep={step} steps={Steps} />

        <div className="grid grid-cols-1 gap-6">
          {renderStepContent()}
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-800">
          {step !== Steps.ESSENTIAL && (
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

          {step !== Steps.CONTACT_PERSON ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-red-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-red-500 transition-colors inline-flex items-center"
            >
              Next
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-3 bg-red-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-red-500 transition-colors"
            >
              Create Box
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BoxCreationForm;