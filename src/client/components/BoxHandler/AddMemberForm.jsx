import React from 'react';
import { User, Mail } from 'lucide-react';

/**
 * AddMemberForm Component
 * A form for users to join a specific "box" (e.g., a gym, community, or group).
 *
 * @param {Object} props - Component properties.
 * @param {string} props.boxName - The name of the box the user is joining.
 * @param {function} props.onSubmit - Function to handle form submission.
 * @param {function} props.onCancel - Function to handle cancel action.
 */
const AddMemberForm = ({ boxName, onSubmit, onCancel }) => {
  return (
    <div className="mt-4 backdrop-blur-sm border-2 border-red-600/50 rounded-lg p-8">
      {/* Form element with submission handler */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Form title dynamically displays the box name */}
        <h2 className="text-3xl font-black uppercase tracking-wider mb-8 text-center">
          Join {boxName}
        </h2>

        <div className="space-y-6">
          {/* Name Input Field */}
          <div className="relative">
            {/* User icon positioned inside the input field */}
            <User className="absolute left-4 top-4 text-gray-500" size={20} />
            <input
              type="text"
              name="name"
              required
              placeholder="Your Name *"
              className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg 
                         focus:ring-2 focus:ring-red-600 focus:border-red-600 text-lg"
            />
          </div>

          {/* Email Input Field */}
          <div className="relative">
            {/* Mail icon positioned inside the input field */}
            <Mail className="absolute left-4 top-4 text-gray-500" size={20} />
            <input
              type="email"
              name="email"
              required
              placeholder="Your Email *"
              className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg 
                         focus:ring-2 focus:ring-red-600 focus:border-red-600 text-lg"
            />
          </div>
        </div>

        {/* Action Buttons: Submit & Cancel */}
        <div className="flex space-x-4 pt-4">
          {/* Submit Button */}
          <button
            type="submit"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 px-8 rounded-lg 
                       font-bold uppercase tracking-wider transition-colors text-lg"
          >
            Add Me
          </button>

          {/* Cancel Button */}
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
