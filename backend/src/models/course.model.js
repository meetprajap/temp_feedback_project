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

    teacherName: {
      type: String,
      required: true,
      trim: true,
    },

    branch: {
      type: String,
      required: true,
      trim: true,
      enum: ["CE", "IT", "CE", "EC", "ME", "Civil"], // you can edit this list
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
    timestamps: true, // this automatically creates createdAt and updatedAt
  }
);

export default mongoose.model("Course", courseSchema);
