'use server';

import { mongoSearchBoxes } from "@/ssr/db/actions"
import { reqBoxSearchSchema } from "@/models/RequestModels";

/**
 * Searches for fitness-related locations based on user input.
 * @param {FormData} formData - The form data containing the search query.
 * @returns {Promise<Object>} - Local MongoDB search results.
 */
export async function searchBoxesMongo(formData) {
  try {
    // Validate input using the schema
    const validatedData = await reqBoxSearchSchema({
        query: formData.get("query"),
      });
      
    const searchQuery = validatedData.query;

    // Use the existing searchBoxes function
    const mongoResults = await mongoSearchBoxes(searchQuery);

    return { mongoResults };
  } catch (error) {
    console.error("Box search error:", error);
    return {
      mongoResults: [],
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
