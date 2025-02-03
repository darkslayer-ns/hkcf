import mongoose from "mongoose";

const BoxSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  location: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  lat: { type: Number },  // Latitude for map-based queries
  lng: { type: Number },  // Longitude for map-based queries
  contactName: { type: String },
  contactEmail: { type: String },
}, { timestamps: true });

export default mongoose.models.Box || mongoose.model("Box", BoxSchema);
