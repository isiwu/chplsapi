import mongoose from "mongoose";

const Schema= mongoose.Schema
const adminSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  role: {
    type: String,
    required: true,
    options: ["Admin", "Super-Admin"],
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Admin", adminSchema);