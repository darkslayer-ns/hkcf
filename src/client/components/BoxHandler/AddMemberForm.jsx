import React, { useState } from 'react';
import { User, Mail, Globe } from 'lucide-react';
import { reqNewHailraiserSchema } from '@/models/RequestModels';
import CountrySelect from '../CountrySelect';
import { addHailraiser } from '@/ssr/db/actions';
import { useGlobal } from '@/app/contexts/GlobalContext';

/**
 * AddMemberForm Component
 * A form for users to join a specific "box" (e.g., a gym, community, or group) with all required fields.
 * Automatically detects submission type based on screen width.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.boxName - The name of the box the user is joining.
 * @param {function} props.onSubmit - Async function to handle form submission. Receives validated hailraiser data.
 * @param {function} props.onCancel - Function to handle cancel action.
 */
const AddMemberForm = ({ boxName, boxId, onSubmit, onCancel }) => {
  const { setHellRaiser } = useGlobal(); // Get global context

  // Local state for form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    country: false,
    email: false
  });

  // Basic email validation
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission

    // Client-side validation
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }

    if (!country) {
      setError('Please select your country');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setSuccess(null); // Clear any previous success message
    
    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      country: true,
      email: true
    });

    // Determine submission type based on User-Agent
    const userAgent = navigator.userAgent.toLowerCase();
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || 
                     // Additional check for iPad with newer iOS versions
                     (navigator.maxTouchPoints && 
                      navigator.maxTouchPoints > 2 && 
                      /macintosh/.test(userAgent));
    const submissionType = isTablet ? 'Tablet' : 'Webform';
    
    // Construct the data object that matches the schema
    const formData = {
      boxId,
      firstName,
      lastName,
      country,
      email,
      submissionType
    };

    try {
      // Clear any previous messages
      setError(null);
      setSuccess(null);

      // Validate the data using Zod schema
      const validatedData = await reqNewHailraiserSchema(formData);

      if (boxId) {
        // If box is selected, add hailraiser directly to database
        await addHailraiser(validatedData);
      } else {
        // If no box selected, store data in global context for BoxCreationForm
        setHellRaiser(validatedData);
      }

      // Clear form fields after successful submission
      setFirstName('');
      setLastName('');
      setCountry('');
      setEmail('');

      // Show success message
      setSuccess(boxId ? 'Successfully added to box!' : 'Information saved, please create your box.');

      // Call the onSubmit prop to update UI
      if (onSubmit) {
        await onSubmit(validatedData);
      }
    } catch (error) {
      console.error('Form error:', error);
      
      // Handle Zod validation errors
      if (error.errors) {
        const errorMessages = error.errors
          .map(err => {
            // Make error messages more user-friendly
            if (err.message.includes('submissionType')) {
              return 'Failed to detect device type. Please try refreshing the page.';
            }
            if (err.message.includes('box') && !boxId) {
              // This should never happen since we made box optional
              return 'Please proceed to create a new box.';
            }
            return err.message;
          })
          .filter(msg => msg); // Filter out empty messages
        
        if (errorMessages.length > 0) {
          setError(errorMessages.join('. '));
          return;
        }
      }
      
      // Handle database errors
      if (error.code === 'permission-denied') {
        setError('You do not have permission to add members to this box.');
        return;
      }
      
      if (error.code === 'already-exists') {
        setError('This email is already registered with this box.');
        return;
      }
      
      // Handle context errors
      if (!boxId && error.message?.includes('setHailraiserData')) {
        setError('Failed to save member data. Please try again.');
        return;
      }
      
      // Handle other errors
      setError(boxId ? 'Failed to add member. Please try again later.' : 
                      'Failed to save member data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 backdrop-blur-sm border-2 border-red-600/50 rounded-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-3xl font-black uppercase tracking-wider mb-8 text-center">
          {boxName ? `Join ${boxName}` : 'Join New Box'}
        </h2>

        {/* Status Messages */}
        {(error || success) && (
          <div 
            className={`p-4 rounded-lg text-center font-medium mb-4 ${
              error 
                ? 'bg-red-500/10 text-red-500 border-2 border-red-500/20' 
                : 'bg-green-500/10 text-green-500 border-2 border-green-500/20'
            }`}
            role="alert"
            aria-live="polite"
          >
            {error || success}
          </div>
        )}

        {/* First Name Input Field */}
        <div className="relative">
          <User className="absolute left-4 top-4 text-gray-500" size={20} />
          <input
            type="text"
            name="firstName"
            value={firstName}
            onChange={(e) => {
              setError(null);
              setSuccess(null);
              setFirstName(e.target.value);
              setTouched(prev => ({ ...prev, firstName: true }));
            }}
            required
            placeholder="First Name *"
            className={`w-full pl-12 pr-4 py-3 bg-black/50 border-2 rounded-lg text-lg
                       focus:ring-2 focus:ring-red-600 focus:border-red-600
                       ${touched.firstName && !firstName.trim()
                         ? 'border-red-500 bg-red-500/5'
                         : firstName.trim()
                           ? 'border-green-500/50 bg-green-500/5'
                           : 'border-gray-800'}`}
          />
        </div>

        {/* Last Name Input Field */}
        <div className="relative">
          <User className="absolute left-4 top-4 text-gray-500" size={20} />
          <input
            type="text"
            name="lastName"
            value={lastName}
            onChange={(e) => {
              setError(null);
              setSuccess(null);
              setLastName(e.target.value);
              setTouched(prev => ({ ...prev, lastName: true }));
            }}
            required
            placeholder="Last Name *"
            className={`w-full pl-12 pr-4 py-3 bg-black/50 border-2 rounded-lg text-lg
                       focus:ring-2 focus:ring-red-600 focus:border-red-600
                       ${touched.lastName && !lastName.trim()
                         ? 'border-red-500 bg-red-500/5'
                         : lastName.trim()
                           ? 'border-green-500/50 bg-green-500/5'
                           : 'border-gray-800'}`}
          />
        </div>

        {/* Country Dropdown Field */}
        <div className="relative">
          <Globe className="absolute left-4 top-4 text-gray-500" size={20} />
          <CountrySelect 
            value={country} 
            touched={touched.country}
            onChange={(val) => {
              setError(null);
              setSuccess(null);
              setCountry(val);
              setTouched(prev => ({ ...prev, country: true }));
            }} 
          />
        </div>

        {/* Email Input Field */}
        <div className="relative">
          <Mail className="absolute left-4 top-4 text-gray-500" size={20} />
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setError(null);
              setSuccess(null);
              setEmail(e.target.value);
              setTouched(prev => ({ ...prev, email: true }));
            }}
            required
            placeholder="Your Email *"
            className={`w-full pl-12 pr-4 py-3 bg-black/50 border-2 rounded-lg text-lg
                       focus:ring-2 focus:ring-red-600 focus:border-red-600
                       ${touched.email && !email.trim()
                         ? 'border-red-500 bg-red-500/5'
                         : email.trim() && isValidEmail(email)
                           ? 'border-green-500/50 bg-green-500/5'
                           : 'border-gray-800'}`}
          />
        </div>

        {/* Action Buttons: Submit & Cancel */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 text-white py-4 px-8 rounded-lg font-bold uppercase tracking-wider transition-colors text-lg
                       ${isSubmitting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isSubmitting ? 'Saving...' : boxId ? 'Add Me' : 'Continue'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={`px-8 py-4 bg-black text-white rounded-lg font-bold uppercase tracking-wider transition-colors text-lg
                       border-2 ${isSubmitting ? 'border-red-400 cursor-not-allowed' : 'border-red-600 hover:bg-gray-900'}`}
          >
            {boxId ? 'Cancel' : 'Back'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMemberForm;