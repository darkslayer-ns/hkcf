'use server';

import { searchBoxes as firebaseSearchBoxes } from "@/ssr/db/actions"
import { reqBoxSearchSchema } from "@/models/RequestModels";

/**
 * Server action that searches for fitness-related locations based on user input.
 * @param {Object|FormData} input - The input containing the search query.
 * @returns {Promise<Object>} - Firebase search results.
 */
export async function searchBoxes(input) {
  try {
    // Extract and validate query
    const query = typeof input === 'object' && input !== null ? input.query : null;
    
    if (!query || typeof query !== 'string') {
      return { 
        results: [], 
        error: 'Invalid search query'
      };
    }



    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return { 
        results: [], 
        error: 'Search query cannot be empty'
      };
    }

    // Validate with schema
    try {
      const validatedData = await reqBoxSearchSchema({ query: trimmedQuery });
      
      // Search boxes in Firebase
      const { results, error } = await firebaseSearchBoxes(validatedData.query);
      
      if (error) {
        console.error('Search error:', error);
        return { 
          results: [], 
          error: error
        };
      }

      return { 
        results: results || [],
        count: (results || []).length
      };

    } catch (error) {
      console.error('Search validation error:', error);
      return { 
        results: [], 
        error: error instanceof Error ? error.message : 'Invalid search query'
      };
    }
  } catch (error) {
    console.error('Unexpected search error:', error);
    return {
      results: [],
      error: 'An unexpected error occurred while searching'
    };
  }
}
