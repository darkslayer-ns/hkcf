import React from 'react';

const inputClass =
  "w-full px-4 py-3 bg-black/50 border-2 border-gray-800 rounded-lg text-base sm:text-lg";

const ContactInfoStep = ({ formData, handleInputChange, isFieldEditable }) => (
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
        disabled={!isFieldEditable('phone')}
        className={inputClass}
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
        disabled={!isFieldEditable('website')}
        className={inputClass}
      />
    </div>
  </>
);

export default ContactInfoStep;
