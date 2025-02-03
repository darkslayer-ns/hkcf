import React, { useState } from 'react';
import { User, Mail, Flag, Globe, Smartphone } from 'lucide-react';
import { Steps } from '@/client/components/BoxHandler';

import { useGlobal } from '@/app/contexts/GlobalContext';
import { reqNewHailraiserSchema } from '@/models/RequestModels';

/**
 * AddMemberForm Component
 * A form for users to join a specific "box" (e.g., a gym, community, or group) with all required fields.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.boxName - The name of the box the user is joining.
 * @param {function} props.onSubmit - Function to handle form submission.
 * @param {function} props.onCancel - Function to handle cancel action.
 */
const AddMemberForm = ({ boxName, onSubmit, onCancel }) => {
  const {
    setHellRaiser, setBoxHandlerStep
  } = useGlobal();

  // Local state for each form field
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [country, setCountry]     = useState('');
  const [eMail, setEMail]         = useState('');
  const [submittedBy, setSubmittedBy] = useState('Webform'); // default value
  const [error, setError] = useState(null);

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Construct the data object that matches the schema.
    const formData = {
      boxname: boxName, // assuming boxName is a valid safeObjectId or similar
      firstName,
      lastName,
      country,
      eMail,
      submittedBy,
      // approved and submissionTimestamp will be set by the schema defaults
    };

    try {
      // Validate the data using Zod schema
      
      const validatedData = await reqNewHailraiserSchema({
        ...formData,
        boxname: null
      });
      
      console.log(validatedData)

      // Update the global state with the new validated data
      setHellRaiser(validatedData);
      setBoxHandlerStep(Steps.CREATE_BOX)

    } catch (validationError) {
      console.error(validationError)
      // Set error message(s) to display if validation fails.
      // For simplicity, we just capture the first error message.
      if (validationError.errors && validationError.errors.length > 0) {
        setError(validationError.errors[0].message);
      } else {
        setError('Validation failed');
      }
    }
  };

  return (
    <div className="mt-4 backdrop-blur-sm border-2 border-red-600/50 rounded-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form title dynamically displays the box name */}
        <h2 className="text-3xl font-black uppercase tracking-wider mb-8 text-center">
          Join {boxName}
        </h2>

        {error && (
          <div className="text-red-500 text-center">
            {error}
          </div>
        )}

        {/* First Name Input Field */}
        <div className="relative">
          <User className="absolute left-4 top-4 text-gray-500" size={20} />
          <input
            type="text"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="First Name *"
            className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg 
                       focus:ring-2 focus:ring-red-600 focus:border-red-600 text-lg"
          />
        </div>

        {/* Last Name Input Field */}
        <div className="relative">
          <User className="absolute left-4 top-4 text-gray-500" size={20} />
          <input
            type="text"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="Last Name *"
            className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg 
                       focus:ring-2 focus:ring-red-600 focus:border-red-600 text-lg"
          />
        </div>

        {/* Country Input Field */}
        <div className="relative">
          <Globe className="absolute left-4 top-4 text-gray-500" size={20} />
          <input
            type="text"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            placeholder="Country *"
            className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg 
                       focus:ring-2 focus:ring-red-600 focus:border-red-600 text-lg"
          />
        </div>

        {/* Email Input Field */}
        <div className="relative">
          <Mail className="absolute left-4 top-4 text-gray-500" size={20} />
          <input
            type="email"
            name="eMail"
            value={eMail}
            onChange={(e) => setEMail(e.target.value)}
            required
            placeholder="Your Email *"
            className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg 
                       focus:ring-2 focus:ring-red-600 focus:border-red-600 text-lg"
          />
        </div>

        {/* Submitted By: Selection Field */}
        <div className="relative">
          <Smartphone className="absolute left-4 top-4 text-gray-500" size={20} />
          <select
            name="submittedBy"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            required
            className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg 
                       focus:ring-2 focus:ring-red-600 focus:border-red-600 text-lg"
          >
            <option value="Tablet">Tablet</option>
            <option value="Webform">Webform</option>
          </select>
        </div>

        {/* Action Buttons: Submit & Cancel */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 px-8 rounded-lg 
                       font-bold uppercase tracking-wider transition-colors text-lg"
          >
            Add Me
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 bg-black hover:bg-gray-900 border-2 border-red-600 text-white 
                       rounded-lg font-bold uppercase tracking-wider transition-colors text-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMemberForm;
