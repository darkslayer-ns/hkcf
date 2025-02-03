import mongoose from "mongoose";

const BoxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    location: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    lat: { type: Number }, // Latitude for map-based queries
    lng: { type: Number }, // Longitude for map-based queries
    contactName: { type: String },
    contactEmail: { type: String },
  },
  { timestamps: true }
);

// ✅ Add text index for full-text search
BoxSchema.index({ name: "text", location: "text", city: "text", state: "text", country: "text" });

const HailraiserSchema = new mongoose.Schema(
  {
    boxname: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Box", // ✅ Reference to Box schema
      required: true,
    },
    address: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    phone: { type: String },
    website: { type: String },
    contactName: { type: String },
    contactEmail: { type: String },
    hellraiserName: { type: String, required: true },
    hellraiserEmail: { type: String },
    approved: { type: Boolean, default: false }, // ✅ Initially FALSE
    submittedBy: { type: String, enum: ["Tablet", "Webform"], required: true },
    submissionTimestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Box = mongoose.models.Box || mongoose.model("Box", BoxSchema);
export const Hailraiser = mongoose.models.Hailraiser || mongoose.model("Hailraiser", HailraiserSchema);