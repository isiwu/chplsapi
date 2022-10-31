import mongoose from "mongoose";

const { Schema } = mongoose;

const certSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  email: String,
  examLocation: {
    type: String,
    required: true,
  },

  transactionId: {
    type: String,
    // required: true,
  },
  paymentDate: {
    type: Date,
    // required: true,
  },
  certificateType: {
    type: String,
    required: true,
  },
  expiredAt: {
    type: Date,
  },
  Approval: {
    type: Number,
    default: 0,
  },
  certNo: {
    type: String,
    default: null,
  },
});

export default mongoose.model("Certification", certSchema);
