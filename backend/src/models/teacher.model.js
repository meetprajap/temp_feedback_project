import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  }],
  isActive: {
    type: Boolean,
    default: true
  }
},{ timestamps:true });

// Create unique indexes
teacherSchema.index({ teacherId: 1 }, { unique: true });
teacherSchema.index({ name: 1 }, { unique: true, sparse: true });

export const Teacher = mongoose.model("Teacher", teacherSchema);
