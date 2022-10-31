import mongoose from "mongoose";

const Schema = mongoose.Schema;

const membershipListsSchema = new Schema({
  membershipName: {
    type: String,
    required: true,
  },
  membershipPrice: {
    type: Number,
    required: true,
  },
});


export default mongoose.model("MembershipLists", membershipListsSchema);