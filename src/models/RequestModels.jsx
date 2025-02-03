import { z } from 'zod';

/* ==============================
 * Base Validation Patterns
 * ============================== */

/**
 * Base string validation pattern
 * Ensures strings are non-empty, within length limits, and contain safe characters
 */
const safeString = z.string()
  .min(1, "Field is required")
  .max(255, "Field cannot exceed 255 characters")
  .regex(/^[a-zA-Z0-9\s.,'-]+$/, "Invalid characters detected");

/**
 * Email validation pattern
 * Ensures email addresses follow standard format
 */
const safeEmail = z.string()
  .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format")
  .optional();

/**
 * Phone number validation pattern
 * Allows digits, spaces, hyphens, parentheses, and plus signs
 */
const safePhone = z.string()
  .regex(/^[\d\s\-()+]+$/, "Invalid phone number")
  .optional();

/**
 * URL validation pattern
 * Ensures URLs follow standard format with optional protocol
 */
const safeURL = z.string()
  .regex(/^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})(\/\S*)?$/, "Invalid website URL")
  .optional();

/**
 * MongoDB ObjectId validation pattern
 * Ensures 24-character hexadecimal string format
 */
const safeObjectId = z.string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId format");

/* ==============================
 * Async Validation Functions
 * ============================== */

/**
 * Validates new box creation data
 * @param {Object} input - Box creation input data
 * @returns {Promise<Object>} Validated box data
 * @throws {Error} Validation error with details
 */
export const reqNewBoxSchema = async (input) => {
  const schema = z.object({
    name: safeString.max(100, "Box name cannot exceed 100 characters"),
    location: safeString.optional(),
    city: safeString.max(50, "City name cannot exceed 50 characters"),
    state: safeString.max(50, "State name cannot exceed 50 characters").optional(),
    country: safeString.max(50, "Country name cannot exceed 50 characters"),
    lat: z.number().optional(),
    lng: z.number().optional(),
    contactName: safeString.optional(),
    contactEmail: safeEmail,
  });

  try {
    return await schema.parseAsync(input);
  } catch (error) {
    console.error('Box validation error:', error.errors);
    console.error(input)
    throw new Error('Invalid box data. Please check your input.');
  }
};

/**
 * Validates new hailraiser creation data
 * @param {Object} input - Hailraiser creation input data
 * @returns {Promise<Object>} Validated hailraiser data
 * @throws {Error} Validation error with details
 */
export const reqNewHailraiserSchema = async (input) => {
  const schema = z.object({
    boxname: safeObjectId.optional().nullable(),
    firstName: safeString.max(50, "City name cannot exceed 50 characters"),
    lastName: safeString.max(50, "City name cannot exceed 50 characters"),
    country: safeString.max(50, "Country name cannot exceed 50 characters"),
    eMail: safeEmail.optional(),
    approved: z.boolean().default(false),
    submittedBy: z.enum(["Tablet", "Webform"]),
    submissionTimestamp: z.date().default(() => new Date()),
  });

  try {
    return await schema.parseAsync(input);
  } catch (error) {
    console.error('Hailraiser validation error:', error.errors);
    throw new Error('Invalid hailraiser data. Please check your input.');
  }
};

/**
 * Validates box search query
 * @param {Object} input - Search query input
 * @returns {Promise<Object>} Validated search parameters
 * @throws {Error} Validation error with details
 */
export const reqBoxSearchSchema = async (input) => {
  const schema = z.object({
    query: safeString,
  });

  try {
    return await schema.parseAsync(input);
  } catch (error) {
    console.error('Search validation error:', error.errors);
    throw new Error('Invalid search query. Please check your input.');
  }
};