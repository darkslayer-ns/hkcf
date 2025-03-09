'use server';


import { getFirestore, getApp } from './firebaseAdmin';
import { reqNewBoxSchema, reqNewHailraiserSchema } from '@/models/RequestModels';

/**
 * Fetches boxes that match the search query using Firestore.
 * @param {searchQuery} str - Query data containing the search query
 * @returns {Promise<{ results: Array, error?: string }>} - Search results and optional error
 */
/**
 * Creates a new box in the database
 * @param {Object} boxData - The box data to create
 * @returns {Promise<Object>} Created box data or error
 */
export async function createBox(boxData) {
  try {
    // Get Firestore instance first to fail fast if DB is unavailable
    const db = await getFirestore();
    if (!db) {
      throw new Error('Database connection error');
    }

    // Validate the box data using schema
    const validatedData = await reqNewBoxSchema(boxData);

    // Normalize the box name and generate search keywords
    const normalizedName = validatedData.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ''); // Only allow lowercase alphanumeric and spaces
    
    // Generate normalized search keywords from the name
    const searchKeywords = normalizedName
      .split(/\s+/)
      .filter(Boolean)
      .map(keyword => keyword.toLowerCase().replace(/[^a-z0-9]/g, '')); // Normalize each keyword
    
    // Check if a box with the same name already exists
    const searchResult = await searchBoxes(normalizedName);
    if (searchResult.results?.some(box => {
      const boxName = box.name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
      return boxName === normalizedName;
    })) {
      throw new Error('A box with this name already exists');
    }

    // Generate a new ID if not provided
    const boxId = db.collection('boxes').doc().id;

    // Prepare box data with metadata
    const timestamp = new Date().toISOString();
    const finalBoxData = {
      ...validatedData,
      id: boxId,
      approved: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      submittedAt: timestamp,
      searchKeywords
    };

    // Save to database
    const boxRef = db.collection('boxes').doc(boxId);
    
    // Check if the ID already exists
    const existingBox = await boxRef.get();
    if (existingBox.exists) {
      throw new Error('A box with this ID already exists');
    }

    // Create the box first
    await boxRef.set(finalBoxData);
    return finalBoxData;
  } catch (error) {
    console.error('Error creating box:', error);
    throw error;
  }
}

/**
 * Adds a new hailraiser to a box
 * @param {Object} hailraiserData - The hailraiser data to add
 * @returns {Promise<Object>} Added hailraiser data or error
 */
export async function addHailraiser(hailraiserData) {
  try {
    // Get Firestore instance first to fail fast if DB is unavailable
    const db = await getFirestore();
    if (!db) {
      throw new Error('Database connection error');
    }

    // Validate the hailraiser data using schema
    const validatedData = await reqNewHailraiserSchema(hailraiserData);

    // Check if the box exists
    const boxRef = db.collection('boxes').doc(validatedData.boxId);
    const boxDoc = await boxRef.get();
    if (!boxDoc.exists) {
      throw new Error('Box not found');
    }

    // Generate a new ID if not provided
    const hailraiserId = db.collection('hailraisers').doc().id;

    // Prepare hailraiser data with metadata
    const timestamp = new Date().toISOString();
    const finalHailraiserData = {
      ...validatedData,
      id: hailraiserId,
      createdAt: timestamp,
      updatedAt: timestamp,
      approved: false // Forcing approved to False
    };

    // Save to database
    const hailraiserRef = db.collection('hailraisers').doc(hailraiserId);
    
    // Check if the ID already exists
    const existingHailraiser = await hailraiserRef.get();
    if (existingHailraiser.exists) {
      throw new Error('A hailraiser with this ID already exists');
    }

    // Save hailraiser data
    await hailraiserRef.set(finalHailraiserData);

    return finalHailraiserData;
  } catch (error) {
    console.error('Error adding hailraiser:', error);
    throw error;
  }
}

export async function searchBoxes(searchQuery) {
  // Validate searchQuery
  if (typeof searchQuery !== 'string') {
    console.error('Invalid search query type:', typeof searchQuery);
    return { 
      results: [], 
      error: 'Search query must be a string' 
    };
  }

  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) {
    return { 
      results: [],
      error: 'Search query cannot be empty'
    };
  }

  try {
    // Get Firestore instance first to fail fast if DB is unavailable
    const db = await getFirestore();
    if (!db) {
      throw new Error('Database connection error');
    }

    // Normalize and split the query into keywords
    const keywords = trimmedQuery
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Only allow lowercase alphanumeric and spaces
      .split(/\s+/)
      .filter(Boolean);

    if (keywords.length === 0) {
      return { results: [] };
    }

    // Create query reference
    const boxesRef = db.collection('boxes');
    const queryRef = boxesRef.where('searchKeywords', 'array-contains', keywords[0]);
    
    // Execute the query
    const snapshot = await queryRef.limit(10).get();
    if (snapshot.empty) {
      return { results: [] };
    }

    // Process and filter results
    const boxes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.searchKeywords) return; // Skip if no keywords array

      // Additional filtering for other keywords
      const matchesAllKeywords = keywords.every(keyword => {
        // Normalize stored keywords for comparison
        const normalizedStoredKeywords = data.searchKeywords.map(k => 
          k.toLowerCase().replace(/[^a-z0-9\s]/g, '')
        );
        return normalizedStoredKeywords.includes(keyword);
      });

      if (matchesAllKeywords) {
        boxes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || null // Convert Firestore Timestamp to Date
        });
      }
    });

    return { 
      results: boxes.slice(0, 10) // Ensure we return max 10 results
    };

  } catch (error) {
    console.error('Error searching boxes:', error);
    return { 
      results: [],
      error: error instanceof Error ? error.message : 'An error occurred while searching'
    };
  }
}
