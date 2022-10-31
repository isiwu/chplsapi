import mongoose from "mongoose";

const Schema = mongoose.Schema;

const licentiateSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  transactionId: {
    type: Number,
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now()
  },
  
});

export default mongoose.model("LicentiateMember", licentiateSchema);