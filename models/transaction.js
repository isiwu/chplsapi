import mongoose from "mongoose";
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  user: {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
  },
  transactionId: {
    type: String,
    required: true,
  },
  paymentDate: {
    type: Date,
    required: true,
  },
  paymentType: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

export default mongoose.model("Transaction", transactionSchema);
