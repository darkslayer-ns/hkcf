'use server';

import { z } from 'zod';

/**
 * Asynchronous function for validating search input.
 * Ensures the query is a non-empty string containing only alphanumeric characters, apostrophes, and spaces.
 * @param {Object} input - The user input containing the search query.
 * @throws {Error} Throws a validation error if the input is invalid.
 * @returns {Promise<Object>} - The validated input object.
 */
export const reqBoxSearchSchema = async (input) => {
  // Define the schema with constraints
  const schema = z.object({
    query: z.string()
      .min(1, 'Search query is required') // Ensures at least one character
      .regex(/^[a-zA-Z0-9' ]+$/, 'Search query can only contain alphanumeric characters, apostrophes, and spaces'), // Restricts input format
  });

  try {
    // Validate the input asynchronously
    return await schema.parseAsync(input);
  } catch (error) {
    console.error('Validation error:', error.errors);

    // Throw an explicit error with details
    throw new Error('Invalid search query. Please enter a valid location.');
  }
};
