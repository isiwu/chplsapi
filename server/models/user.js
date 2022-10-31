import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  active:{
    type: Boolean,
    default: true,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  membership: {
    licentiate: {
      isMember: {
        type: Boolean,
        default: false,
      },
      hasExpired: {
        type: Boolean,
        default: false,
      },
      isApproved: {
        type: Boolean,
        default: false,
      },
      id: Number,
      transactionId: String,
      applicationFee: Number,
      subscriptionFee: Number,
      appliedAt: Date,
      approvedAt: Date,
      renewedAt: Date,
      card: String,
    },
    associate: {
      isMember: {
        type: Boolean,
        default: false,
      },
      hasExpired: {
        type: Boolean,
        default: false,
      },
      isApproved: {
        type: Boolean,
        default: false,
      },
      id: Number,
      transactionId: String,
      applicationFee: Number,
      subscriptionFee: Number,
      appliedAt: Date,
      approvedAt: Date,
      renewedAt: Date,
      card: String,
    },
    full: {
      isMember: {
        type: Boolean,
        default: false,
      },
      hasExpired: {
        type: Boolean,
        default: false,
      },
      isApproved: {
        type: Boolean,
        default: false,
      },
      id: Number,
      transactionId: String,
      applicationFee: Number,
      subscriptionFee: Number,
      appliedAt: Date,
      approvedAt: Date,
      renewedAt: Date,
      card: String,
    },
    corporate: {
      isMember: {
        type: Boolean,
        default: false,
      },
      hasExpired: {
        type: Boolean,
        default: false,
      },
      id: Number,
      transactionId: Number,
      joinedAt: Date,
      renewedAt: Date,
      card: String,
    },
  },
  verification: {
    type: Boolean,
    default: false,
  },
  certified: {
    CLTA: {
      type: Boolean,
      default: false,
      required: true,
    },
    CHLPS: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  certificates: [
    {
      certType: {
        type: String,
      },
      urlPath: {
        type: String,
      },
    },
  ],
  title: {
    type: String,
    default: null,
  },

  organization: {
    type: String,
    default: null,
  },

  speciality: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: null,
  },
  apiToken: {
    type: String,
    required: true,
    unique: true,
  },
});

export default mongoose.model("User", userSchema);
