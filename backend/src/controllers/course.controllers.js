import Course from '../models/course.model.js';
import { Teacher } from '../models/teacher.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import requestHandler from '../utils/asyncHandler.js';
import { createCourseblock } from '../services/blockchainService.js';
// Create a new course (Admin only)
const createCourse = requestHandler(async (req, res) => {
  const { courseId, courseName, teachers, branch, courseTime } = req.body;

  // Validate all fields are provided
  if (!courseId || !courseName || !teachers || !branch || !courseTime) {
    throw new ApiError(400, "All fields (courseId, courseName, teachers, branch, courseTime) are required");
  }

  // Validate teachers array
  if (!Array.isArray(teachers) || teachers.length === 0) {
    throw new ApiError(400, "At least one teacher is required");
  }

  // Check if course already exists
  const existingCourse = await Course.findOne({ courseId });
  if (existingCourse) {
    throw new ApiError(409, `Course with ID ${courseId} already exists`);
  }

  // Create new course in database first
  const course = await Course.create({
    courseId,
    courseName,
    teachers: [],
    branch,
    courseTime,
  });

  // Find or create teachers by teacherId and add course to their courses array
  const teacherIds = [];
  for (const teacherId of teachers) {
    if (!teacherId || typeof teacherId !== 'string' || !teacherId.trim()) {
      throw new ApiError(400, "Invalid teacher ID provided");
    }

    // Find existing teacher by teacherId
    let teacher = await Teacher.findOne({ teacherId: teacherId.trim() });
    
    // If teacher doesn't exist, create a new one
    if (!teacher) {
      try {
        teacher = await Teacher.create({
          teacherId: teacherId.trim(),
          name: teacherId.trim(), // Use teacherId as name if not provided
          courses: [course._id],
          isActive: true,
        });
      } catch (error) {
        // Handle duplicate key error in case of race condition
        if (error.code === 11000) {
          teacher = await Teacher.findOne({ teacherId: teacherId.trim() });
          if (!teacher) {
            throw error;
          }
          if (!teacher.courses.includes(course._id)) {
            teacher = await Teacher.findByIdAndUpdate(
              teacher._id,
              { $addToSet: { courses: course._id } },
              { new: true }
            );
          }
        } else {
          throw error;
        }
      }
    } else {
      // If teacher exists, add course to their courses array if not already there
      if (!teacher.courses.includes(course._id)) {
        teacher = await Teacher.findByIdAndUpdate(
          teacher._id,
          { $addToSet: { courses: course._id } },
          { new: true }
        );
      }
    }
    teacherIds.push(teacher._id);
  }

  const  toservice = await createCourseblock(course);
  // Update course with teacher IDs
  const updatedCourse = await Course.findByIdAndUpdate(
    course._id,
    { $set: { teachers: teacherIds } },
    { new: true }
  ).populate('teachers');

  return res.status(201).json(
    new ApiResponse(201, updatedCourse, "Course created successfully")
  );
});

// Get all courses (For students to see courses for feedback)
// Expands courses with multiple teachers into separate entries
const getAllCourses = requestHandler(async (req, res) => {
  const courses = await Course.find().populate('teachers');
  
  if (!courses || courses.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No courses available")
    );
  }

  // Expand courses: if a course has multiple teachers, create separate entries for each
  const expandedCourses = [];
  courses.forEach(course => {
    if (course.teachers && course.teachers.length > 0) {
      // Create one entry per teacher
      course.teachers.forEach(teacher => {
        expandedCourses.push({
          ...course.toObject(),
          teacherId: teacher._id,
          teacherName: teacher.name,
          teacherEmail: teacher.email || null,
          originalTeachersArray: course.teachers.map(t => ({
            _id: t._id,
            name: t.name,
            teacherId: t.teacherId,
            email: t.email
          }))
        });
      });
    } else {
      // If no teachers, add the course as-is
      expandedCourses.push(course.toObject());
    }
  });

  return res.status(200).json(
    new ApiResponse(200, expandedCourses, "Courses retrieved successfully")
  );
});

// Get course by ID
const getCourseById = requestHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findOne({ courseId }).populate('teachers');
  
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
  const { courseName, teachers, branch, courseTime } = req.body;

  // Find course
  const course = await Course.findOne({ courseId });
  if (!course) {
    throw new ApiError(404, `Course with ID ${courseId} not found`);
  }

  // Handle teachers update
  let teacherIds = course.teachers;
  if (teachers && Array.isArray(teachers) && teachers.length > 0) {
    teacherIds = [];
    for (const teacherId of teachers) {
      if (!teacherId || typeof teacherId !== 'string' || !teacherId.trim()) {
        throw new ApiError(400, "Invalid teacher ID provided");
      }

      // Find or create teacher by teacherId
      let teacher = await Teacher.findOne({ teacherId: teacherId.trim() });
      
      if (!teacher) {
        try {
          teacher = await Teacher.create({
            teacherId: teacherId.trim(),
            name: teacherId.trim(),
            courses: [],
            isActive: true,
          });
        } catch (error) {
          if (error.code === 11000) {
            teacher = await Teacher.findOne({ teacherId: teacherId.trim() });
            if (!teacher) {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }
      teacherIds.push(teacher._id);
    }
  }

  // Update course
  const updatedCourse = await Course.findOneAndUpdate(
    { courseId },
    {
      $set: {
        ...(courseName && { courseName }),
        ...(teacherIds && { teachers: teacherIds }),
        ...(branch && { branch }),
        ...(courseTime && { courseTime })
      }
    },
    { new: true }
  ).populate('teachers');

  // If teachers were updated, update their courses arrays
  if (teachers && Array.isArray(teachers) && teachers.length > 0) {
    // Remove course from old teachers
    for (const oldTeacherId of course.teachers) {
      if (!teacherIds.includes(oldTeacherId)) {
        await Teacher.findByIdAndUpdate(
          oldTeacherId,
          { $pull: { courses: updatedCourse._id } },
          { new: true }
        );
      }
    }
    
    // Add course to new teachers
    for (const newTeacherId of teacherIds) {
      await Teacher.findByIdAndUpdate(
        newTeacherId,
        { $addToSet: { courses: updatedCourse._id } },
        { new: true }
      );
    }
  }

  return res.status(200).json(
    new ApiResponse(200, updatedCourse, "Course updated successfully")
  );
});

// Delete course (Admin only)
const deleteCourse = requestHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findOneAndDelete({ courseId });

  if (!course) {
    throw new ApiError(404, `Course with ID ${courseId} not found`);
  }

  // Remove course from all associated teachers
  for (const teacherId of course.teachers) {
    await Teacher.findByIdAndUpdate(
      teacherId,
      { $pull: { courses: course._id } },
      { new: true }
    );
  }

  return res.status(200).json(
    new ApiResponse(200, course, "Course deleted successfully")
  );
});

// Get courses by branch (For filtering)
// Expands courses with multiple teachers into separate entries
const getCoursesByBranch = requestHandler(async (req, res) => {
  const { branch } = req.params;

  const courses = await Course.find({ branch }).populate('teachers');

  if (!courses || courses.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], `No courses found for branch: ${branch}`)
    );
  }

  // Expand courses: if a course has multiple teachers, create separate entries for each
  const expandedCourses = [];
  courses.forEach(course => {
    if (course.teachers && course.teachers.length > 0) {
      // Create one entry per teacher
      course.teachers.forEach(teacher => {
        expandedCourses.push({
          ...course.toObject(),
          teacherId: teacher._id,
          teacherName: teacher.name,
          teacherEmail: teacher.email || null,
          originalTeachersArray: course.teachers.map(t => ({
            _id: t._id,
            name: t.name,
            teacherId: t.teacherId,
            email: t.email
          }))
        });
      });
    } else {
      // If no teachers, add the course as-is
      expandedCourses.push(course.toObject());
    }
  });

  return res.status(200).json(
    new ApiResponse(200, expandedCourses, `Courses for branch ${branch} retrieved successfully`)
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
