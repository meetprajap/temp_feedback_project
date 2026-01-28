import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseId: {
      type: Number,
      required: true,
      unique: true,
    },

    courseName: {
      type: String,
      required: true,
      trim: true,
    },

    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
      }
    ],

    branch: {
      type: String,
      required: true,
      trim: true,
      enum: ["CE", "IT", "EC", "ME", "Civil"],
    },

    courseTime: {
      type: String,
      trim: true,
    },

    blockchainTxHash: {
      type: String,
      default: null
    },

    blockchainBlockNumber: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Course", courseSchema);
