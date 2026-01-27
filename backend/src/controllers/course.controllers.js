import Course from '../models/course.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import requestHandler from '../utils/asyncHandler.js';

// Create a new course (Admin only)
const createCourse = requestHandler(async (req, res) => {
  const { courseId, courseName, teacherName, branch } = req.body;

  // Validate all fields are provided
  if (!courseId || !courseName || !teacherName || !branch) {
    throw new ApiError(400, "All fields (courseId, courseName, teacherName, branch) are required");
  }

  // Check if course already exists
  const existingCourse = await Course.findOne({ courseId });
  if (existingCourse) {
    throw new ApiError(409, `Course with ID ${courseId} already exists`);
  }

  // Create new course in database
  const course = await Course.create({
    courseId,
    courseName,
    teacherName,
    branch
  });

  return res.status(201).json(
    new ApiResponse(201, course, "Course created successfully")
  );
});

// Get all courses (For students to see courses for feedback)
const getAllCourses = requestHandler(async (req, res) => {
  const courses = await Course.find();
  
  if (!courses || courses.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No courses available")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, courses, "Courses retrieved successfully")
  );
});

// Get course by ID
const getCourseById = requestHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findOne({ courseId });
  
  if (!course) {
    throw new ApiError(404, `Course with ID ${courseId} not found`);
  }

  return res.status(200).json(
    new ApiResponse(200, course, "Course retrieved successfully")
  );
});

// Update course (Admin only)
const updateCourse = requestHandler(async (req, res) => {
  const { courseId } = req.params;
  const { courseName, teacherName, branch } = req.body;

  // Find course and update
  const course = await Course.findOneAndUpdate(
    { courseId },
    {
      $set: {
        ...(courseName && { courseName }),
        ...(teacherName && { teacherName }),
        ...(branch && { branch })
      }
    },
    { new: true }
  );

  if (!course) {
    throw new ApiError(404, `Course with ID ${courseId} not found`);
  }

  return res.status(200).json(
    new ApiResponse(200, course, "Course updated successfully")
  );
});

// Delete course (Admin only)
const deleteCourse = requestHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findOneAndDelete({ courseId });

  if (!course) {
    throw new ApiError(404, `Course with ID ${courseId} not found`);
  }

  return res.status(200).json(
    new ApiResponse(200, course, "Course deleted successfully")
  );
});

// Get courses by branch (For filtering)
const getCoursesByBranch = requestHandler(async (req, res) => {
  const { branch } = req.params;

  const courses = await Course.find({ branch });

  if (!courses || courses.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], `No courses found for branch: ${branch}`)
    );
  }

  return res.status(200).json(
    new ApiResponse(200, courses, `Courses for branch ${branch} retrieved successfully`)
  );
});

export {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByBranch
};
