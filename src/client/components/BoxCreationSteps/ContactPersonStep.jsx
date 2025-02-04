import React from 'react';

const inputClass =
  "w-full px-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg text-base sm:text-lg";

const ContactPersonStep = ({ formData, handleInputChange, isFieldEditable }) => (
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
        disabled={!isFieldEditable('contactName')}
        className={inputClass}
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
        disabled={!isFieldEditable('contactEmail')}
        className={inputClass}
      />
    </div>
  </>
);

export default ContactPersonStep;
