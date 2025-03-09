import { z } from 'zod';

/* ==============================
 * Base Validation Patterns
 * ============================== */

/**
 * Base string validation pattern
 * Ensures strings are non-empty, within length limits, and contain safe characters
 */
const safeString = z.union([
  z.string()
    .min(0) // Allows empty string
    .max(255, "Field cannot exceed 255 characters")
    .regex(/^[\p{L}0-9\s.,'"|\-]*$/u, "Invalid characters detected"),
  z.literal(""), // Explicitly allow empty string
  z.null()       // Explicitly allow null
]).optional();

/**
 * Box name validation pattern
 * More strict than safeString - requires 3-50 chars, no empty strings
 */
const boxNameString = z.string()
  .min(3, "Box name must be at least 3 characters long")
  .max(50, "Box name cannot exceed 50 characters")
  .regex(/^[\p{L}0-9\s.,'"|\-]*$/u, "Box name can only contain letters, numbers, spaces, and basic punctuation")
  .transform(val => val.trim());




/**
 * Email validation pattern
 * Ensures email addresses follow standard format
 */
const safeEmail = z
  .union([
    z.string().regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Invalid email format"
    ),
    z.literal(""),  // Allow an empty string
    z.null()        // Allow null
  ])
  .optional();


/**
 * Phone number validation pattern
 * Allows digits, spaces, hyphens, parentheses, and plus signs
 */
const safePhone = z.union([
  z.string()
    .regex(/^[\d\s\-()+]+$/, "Invalid phone number"),
  z.literal(""), // Explicitly allow an empty string
  z.null()       // Explicitly allow null
]).optional();

/**
 * URL validation pattern
 * Ensures URLs follow standard format with optional protocol
 */
const safeURL = z.union([
  z.string()
    .regex(/^(https?:\/\/)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})(\/\S*)?$/, "Invalid website URL"),
  z.literal(""), // Allow an empty string explicitly
  z.null()       // Allow null explicitly
]).optional();


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
    id: z.string().optional(),
    name: boxNameString.transform(val => val?.trim()),
    location: safeString.transform(val => val?.trim()),
    city: safeString.transform(val => val?.trim()),
    state: safeString.transform(val => val?.trim()),
    country: safeString.transform(val => val?.trim()),
    lat: z.number().optional(),
    lng: z.number().optional(),
    contactName: safeString.optional().nullable().transform(val => val?.trim()),
    contactEmail: safeEmail.optional().nullable().transform(val => val?.trim().toLowerCase()),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date())
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
    id: z.string().optional().nullable(),
    boxId: z.string().optional().nullable(),
    box: boxNameString.optional(),  // The box name field (optional when creating new box)
    firstName: safeString.transform(val => val?.trim()),
    lastName: safeString.transform(val => val?.trim()),
    country: safeString.transform(val => val?.trim()),
    email: safeEmail.transform(val => val?.trim().toLowerCase()),
    approved: z.boolean().default(false),
    submissionType: z.enum(["Tablet", "Webform"], {
      required_error: "Submission type is required",
      invalid_type_error: "Submission type must be either 'Tablet' or 'Webform'"
    }),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date())
  });

  try {
    console.log(input)
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