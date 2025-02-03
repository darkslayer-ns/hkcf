import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing a value.
 * Delays updating the value until after the specified time has passed.
 *
 * @param {any} value - The input value to debounce.
 * @param {number} [delay=300] - Delay in milliseconds before updating the value.
 * @returns {any} - The debounced value.
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: Clears the timeout if the value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Runs the effect when value or delay changes

  return debouncedValue; // Return the debounced value
};

export default useDebounce;
