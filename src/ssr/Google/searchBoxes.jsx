'use server';

import { reqBoxSearchSchema } from '@/models/RequestModels';
import NodeCache from 'node-cache';
import iso3166 from 'iso-3166-1';

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // Cache results for 1 hour, cleanup every 10 minutes
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');

/**
 * Parses an address using the Google Geocoding API.
 * @param {string} address - The full address string.
 * @returns {Object} - Parsed components (city, state, postal code, country, countryCode, etc.).
 */
async function parseAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error("Address lookup failed");
    }

    const components = data.results[0].address_components;
    let street = "",
      streetNumber = "",
      city = "",
      county = "",
      state = "",
      postalCode = "",
      country = "",
      countryCode = "";

    components.forEach((component) => {
      if (component.types.includes("street_number")) {
        streetNumber = component.long_name;
      }
      if (component.types.includes("route")) {
        street = component.long_name;
      }
      if (component.types.includes("locality")) {
        city = component.long_name;
      }
      if (component.types.includes("administrative_area_level_2")) {
        county = component.long_name;
      }
      if (component.types.includes("administrative_area_level_1")) {
        state = component.long_name;
      }
      if (component.types.includes("postal_code")) {
        postalCode = component.long_name;
      }
      if (component.types.includes("country")) {
        country = component.long_name;
        
        // Use the iso-3166-1 library to derive the ISO country code (alpha-2)
        const countryData = iso3166.whereCountry(country);
        countryCode = countryData ? countryData.alpha2 : "";
      }
    });

    return {
      street: streetNumber ? `${streetNumber} ${street}` : street,
      city,
      county,
      state,
      postalCode,
      country,
      countryCode, // Derived ISO 3166-1 alpha-2 country code
    };
  } catch (error) {
    console.error("Error parsing address:", error);
    return null;
  }
}

/**
 * Fetches additional details for a place using Google Places Details API.
 * Uses caching to avoid redundant API calls.
 * @param {string} placeId - The Google Place ID.
 * @returns {Promise<Object>} - Additional details including phone and website.
 */
async function fetchPlaceDetails(placeId) {
  const cacheKey = `placeDetails:${placeId}`;
  const cachedDetails = cache.get(cacheKey);
  if (cachedDetails) {
    return cachedDetails;
  }

  try {
    detailsUrl.searchParams.set('key', apiKey);
    detailsUrl.searchParams.set('place_id', placeId);

    const response = await fetch(detailsUrl.toString(), { method: 'GET' });
    if (!response.ok) throw new Error('Failed to fetch place details');

    const data = await response.json();
    const result = data.result || {};

    const details = {
      phone: result.formatted_phone_number || '',
      website: result.website || ''
    };
    
    cache.set(cacheKey, details);
    return details;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return { phone: '', website: '' };
  }
}

/**
 * Fetches Google Places results based on a search query.
 * Uses caching to avoid excessive API calls.
 * @param {string} searchQuery - The search location.
 * @returns {Promise<Array>} - Array of Google Places results.
 */
async function fetchGooglePlaces(searchQuery) {
  try {
    const cacheKey = `googlePlaces:${searchQuery}`;

    // Check cache for existing results
    const cachedResults = cache.get(cacheKey);
    if (cachedResults) {
      console.log("Returning cached Google Places results for:", searchQuery);
      return cachedResults;
    }

    // Configure Google Places API request parameters
    searchUrl.searchParams.set('key', apiKey);
    searchUrl.searchParams.set('query', `CrossFit OR gym OR fitness in ${searchQuery}`);
    searchUrl.searchParams.set('keyword', 'CrossFit OR gym OR fitness');

    // Make API request
    const response = await fetch(searchUrl.toString(), { method: 'GET' });
    if (!response.ok) throw new Error('Failed to fetch Google Places results');

    const data = await response.json();

    // Process API response
    const googleResults = await Promise.all(
      (data.results || []).map(async (place) => {
        const { city, state, country, countryCode } = await parseAddress(place.formatted_address);
        const additionalDetails = await fetchPlaceDetails(place.place_id);

        return {
          id: place.place_id,
          name: place.name,
          location: place.formatted_address,
          lat: place.geometry?.location?.lat || null,   
          lng: place.geometry?.location?.lng || null,  
          rating: place.rating,
          totalRatings: place.user_ratings_total,
          address: place.formatted_address || '',
          city,
          state,
          country,
          countryCode, // ISO country code added here
          phone: additionalDetails.phone,
          website: additionalDetails.website,
          contactName: '', // Placeholder, requires manual entry
          contactEmail: '' // Placeholder, requires manual entry
        };
      })
    );

    // Store results in cache
    cache.set(cacheKey, googleResults);
    return googleResults;

  } catch (error) {
    console.error('Google Places API error:', error);
    return [];
  }
}

/**
 * Searches for fitness-related locations based on user input.
 * Validates input and fetches results from Google Places API.
 * @param {FormData} formData - The form data containing the search query.
 * @returns {Promise<Object>} - Local and Google Places search results.
 */
export async function searchBoxesGoogle(formData) {
  try {
    let validatedData;

    // Validate input with error handling
    try {
      validatedData = await reqBoxSearchSchema({
        query: formData.get('query')
      });
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return { 
        googleResults: [], 
        error: 'Invalid search query. Please enter a valid location.' 
      };
    }

    const searchQuery = validatedData.query.toLowerCase();

    // Fetch Google Places results
    const googleResults = await fetchGooglePlaces(searchQuery);

    return {
      googleResults
    };

  } catch (error) {
    console.error('Box search error:', error);
    return { 
      googleResults: [], 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}
