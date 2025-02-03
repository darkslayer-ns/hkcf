import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * ProgressBar Component
 * Displays a multi-step progress bar using an enum-based step system.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.currentStep - The currently active step, selected from the steps enum.
 * @param {Object} props.steps - An enum object containing step keys and values.
 */
const ProgressBar = ({ currentStep, steps }) => {
  const stepEntries = Object.entries(steps); // Convert enum object to an array of [key, value] pairs.

  return (
    <div className="flex items-center justify-between mb-8">
      {stepEntries.map(([key, value], index) => {
        const isActive = currentStep === value; // Checks if the current step is active.
        const isPast = stepEntries.findIndex(([_, v]) => v === currentStep) > index; // Determines if step has been completed.

        return (
          <React.Fragment key={value}>
            <div className="flex-1 relative">
              <div
                className={`
                  h-16 
                  ${index === 0 ? 'rounded-l-lg' : ''} 
                  ${index === stepEntries.length - 1 ? 'rounded-r-lg' : ''}
                  ${isActive ? 'bg-cfhk-red' : isPast ? 'bg-red-700' : 'bg-cfhk-dark'}
                  flex items-center justify-center group
                  transition-all duration-300
                `}
              >
                {/* Displays the step label, formatted for readability */}
                <span className="text-white font-bold">{value}</span>

                {/* Displays a right arrow for steps that are not the last in sequence */}
                {index < stepEntries.length - 1 && (
                  <ChevronRight
                    className={`
                      absolute -right-3 z-10 h-8 w-8
                      ${isActive ? 'text-cfhk-red animate-chevron' : isPast ? 'text-red-700' : 'text-cfhk-dark'}
                    `}
                  />
                )}
              </div>
            </div>

            {/* Adds spacing between steps, except for the last one */}
            {index < stepEntries.length - 1 && <div className="w-6" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressBar;
