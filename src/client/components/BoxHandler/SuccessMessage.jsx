import React from 'react';
import { Check } from 'lucide-react';

/**
 * SuccessMessage Component
 * Displays a success message when a user successfully joins a box.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.boxName - The name of the box the user has joined.
 * @param {function} props.onReset - Callback function to reset the state (e.g., close the message).
 */
const SuccessMessage = ({ boxName, onReset }) => {
  return (
    <div className="mt-4 bg-black/80 backdrop-blur-sm border-2 border-red-600/50 rounded-lg p-8 text-center">
      
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="bg-green-600/20 p-4 rounded-full">
          <Check className="text-green-500" size={48} />
        </div>
      </div>

      {/* Success Title */}
      <h2 className="text-3xl font-black uppercase tracking-wider mb-8">
        Welcome to the Community!
      </h2>

      {/* Success Message with Box Name */}
      <p className="text-xl text-gray-300 mb-8">
        You're now listed in the directory for <strong>{boxName}</strong>.
      </p>

      {/* Done Button - Calls onReset to reset state or close message */}
      <button
        onClick={onReset}
        className="bg-red-600 hover:bg-red-700 text-white py-4 px-8 rounded-lg font-bold uppercase 
                   tracking-wider transition-colors text-lg"
      >
        Done
      </button>
    </div>
  );
};

export default SuccessMessage;
