import mongoose from "mongoose";

const Schema = mongoose.Schema;
const EmailverificationSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
  },
  emailCode: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Emailverification", EmailverificationSchema);
