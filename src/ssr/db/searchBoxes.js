'use server';

import dbConnect from "@/ssr/db/mongo";
import Box from "@/ssr/db/Models"
import { reqBoxSearchSchema } from "@/models/RequestModels";

/**
 * Searches for boxes in MongoDB based on user input.
 * @param {string} searchQuery - The user’s search query.
 * @returns {Promise<Array>} - Array of matching boxes.
 */
async function fetchMongoBoxes(searchQuery) {
  try {
    await dbConnect();

    // MongoDB text search (case-insensitive)
    const boxes = await Box.find({
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } },
        { city: { $regex: searchQuery, $options: "i" } },
        { state: { $regex: searchQuery, $options: "i" } },
        { country: { $regex: searchQuery, $options: "i" } },
      ],
    }).limit(10); // Limit results for efficiency

    return boxes;
  } catch (error) {
    console.error("MongoDB Search Error:", error);
    return [];
  }
}

/**
 * Searches for fitness-related locations based on user input.
 * @param {FormData} formData - The form data containing the search query.
 * @returns {Promise<Object>} - Local MongoDB search results.
 */
export async function searchBoxesMongo(formData) {
  try {
    let validatedData;

    // Validate input with error handling
    try {
      validatedData = await reqBoxSearchSchema({
        query: formData.get("query"),
      });
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return {
        mongoResults: [],
        error: "Invalid search query. Please enter a valid location.",
      };
    }

    const searchQuery = validatedData.query.toLowerCase();

    // Fetch results from MongoDB
    const mongoResults = await fetchMongoBoxes(searchQuery);

    return {
      mongoResults,
    };
  } catch (error) {
    console.error("Box search error:", error);
    return {
      mongoResults: [],
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
