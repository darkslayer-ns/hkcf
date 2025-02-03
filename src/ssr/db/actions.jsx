'use server';

import dbConnect from "@/ssr/db/mongo"
import { Box } from "@/models/MongoModels"

/**
 * Fetches boxes that match the search query using MongoDB's full-text search.
 * @param {string} query - The search query entered by the user.
 * @returns {Array} - List of matching boxes.
 */
export async function mongoSearchBoxes(query) {
  await dbConnect(); // Ensure database is connected

  if (!query.trim()) return [];

  try {
    const boxes = await Box.find(
      { $text: { $search: query } }, // Full-text search
      { score: { $meta: "textScore" } } // Get relevance score
    )
      .sort({ score: { $meta: "textScore" } }) // Sort by relevance
      .limit(10); // Limit results

    return boxes;
  } catch (error) {
    console.error("Error fetching boxes:", error);
    return [];
  }
}
