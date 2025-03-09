'use server';

import { reqBoxSearchSchema } from '@/models/RequestModels';
import NodeCache from 'node-cache';
import iso3166 from 'iso-3166-1';

// Cache results for 1 hour, cleanup every 10 minutes
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');

/**
 * Parses an address using the Google Geocoding API.
 * @param {string} address - The full address string.
 * @returns {Object} - Parsed components (city, state, postal code, country, countryCode, etc.).
 */
async function parseAddress(address) {
  if (!apiKey) {
    console.error('Google Maps API key is missing');
    throw new Error('Google Maps API key is not configured');
  }

  // Construct the URL for the Geocoding API call
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error('Google Geocoding API error:', data.status, data.error_message);
      throw new Error(
        `Address lookup failed: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`
      );
    }

    // Parse the address components from the response
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
      countryCode,
    };
  } catch (error) {
    console.error("Error parsing address:", error);
    return null;
  }
}

/**
 * Fetches additional details for a place using the Google Places Details API.
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

  if (!apiKey) {
    console.error('Google Maps API key is missing');
    throw new Error('Google Maps API key is not configured');
  }

  // Set the search parameters for the details URL
  detailsUrl.searchParams.set('key', apiKey);
  detailsUrl.searchParams.set('place_id', placeId);

  try {
    const response = await fetch(detailsUrl.toString(), { method: 'GET' });
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places Details API error:', data.status, data.error_message);
      throw new Error(
        `Failed to fetch place details: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`
      );
    }

    const details = {
      phone: data.result?.formatted_phone_number || '',
      website: data.result?.website || '',
    };

    // Cache the fetched details
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
  const cacheKey = `googlePlaces:${searchQuery}`;
  const cachedResults = cache.get(cacheKey);
  if (cachedResults) {
    console.log("Returning cached Google Places results for:", searchQuery);
    return cachedResults;
  }

  if (!apiKey) {
    console.error('Google Maps API key is missing');
    throw new Error('Google Maps API key is not configured');
  }

  // Reset search parameters
  searchUrl.searchParams.forEach((_, key) => searchUrl.searchParams.delete(key));

  // Configure search parameters
  searchUrl.searchParams.set('key', apiKey);
  searchUrl.searchParams.set('query', searchQuery);
  searchUrl.searchParams.set('type', 'gym');
  // Removed radius parameter as per requirement

  // Debug log the search URL with API key redacted
  const debugUrl = new URL(searchUrl.toString());
  debugUrl.searchParams.set('key', 'REDACTED');
  console.log('Search URL:', debugUrl.toString());

  try {
    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('HTTP error:', response.status, response.statusText);
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Google Places API response:', {
      status: data.status,
      results: data.results ? data.results.length : 0,
      error_message: data.error_message,
    });

    if (data.status === 'ZERO_RESULTS') {
      console.log('No results found for query:', searchQuery);
      return [];
    }

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      throw new Error(
        `Failed to fetch Google Places results: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`
      );
    }

    // Process API response and enrich each result with additional details
    const googleResults = await Promise.all(
      (data.results || []).map(async (place) => {
        try {
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
            countryCode,
            phone: additionalDetails.phone,
            website: additionalDetails.website,
            contactName: '', // Placeholder, requires manual entry
            contactEmail: '', // Placeholder, requires manual entry
          };
        } catch (placeError) {
          console.error('Error processing place:', place.place_id, placeError);
          return null;
        }
      })
    );

    // Filter out any failed results and cache the valid ones
    const validResults = googleResults.filter(result => result !== null);
    if (validResults.length > 0) {
      cache.set(cacheKey, validResults);
    }
    return validResults;
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
  console.log('Starting search with formData:', formData);

  if (!formData) {
    console.error('No form data provided');
    return {
      googleResults: [],
      error: 'No search query provided',
    };
  }

  const query = formData.get('query');
  console.log('Raw query:', query);

  if (!query) {
    console.error('No query in form data');
    return {
      googleResults: [],
      error: 'Please enter a location to search',
    };
  }

  let validatedData;
  // Validate input using the provided schema
  try {
    validatedData = await reqBoxSearchSchema({ query });
    console.log('Validated query:', validatedData);
  } catch (validationError) {
    console.error('Validation error:', validationError);
    return {
      googleResults: [],
      error: 'Invalid search query. Please enter a valid location.',
    };
  }

  const searchQuery = validatedData.query.toLowerCase();
  console.log('Searching for:', searchQuery);

  try {
    const googleResults = await fetchGooglePlaces(searchQuery);
    console.log(`Found ${googleResults.length} results`);
    return { googleResults };
  } catch (error) {
    console.error('Box search error:', error);
    return {
      googleResults: [],
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}
