import Course from '../models/course.model.js';
import { Teacher } from '../models/teacher.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import requestHandler from '../utils/asyncHandler.js';
import { createCourseblock, getTeacherCourseAveragesFromBlockchain } from '../services/blockchainService.js';
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

  // Validate each teacher has required fields
  for (const teacher of teachers) {
    if (!teacher.teacherId || !teacher.teacherName) {
      throw new ApiError(400, "Each teacher must have teacherId and teacherName");
    }
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

  console.log(`📚 Creating course: ${courseName} (ID: ${courseId})`);
  console.log(`📝 Processing ${teachers.length} teacher(s)...`);

  // Process and store teachers in MongoDB
  const teacherIds = [];
  const teachersForBlockchain = [];

  for (const teacherData of teachers) {
    const teacherId = teacherData.teacherId.toString().trim();
    const teacherName = teacherData.teacherName.toString().trim();

    console.log(`   - Processing teacher: ${teacherName} (ID: ${teacherId})`);

    // Find existing teacher by teacherId
    let teacher = await Teacher.findOne({ teacherId });
    
    // If teacher doesn't exist, create a new one
    if (!teacher) {
      try {
        teacher = await Teacher.create({
          teacherId,
          name: teacherName,
          courses: [course._id],
          isActive: true,
        });
        console.log(`   ✅ New teacher created in MongoDB: ${teacherName}`);
      } catch (error) {
        // Handle duplicate key error in case of race condition
        if (error.code === 11000) {
          teacher = await Teacher.findOne({ teacherId });
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
          console.log(`   ✅ Existing teacher linked: ${teacherName}`);
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
        console.log(`   ✅ Course added to existing teacher: ${teacherName}`);
      } else {
        console.log(`   ✅ Teacher already linked to course: ${teacherName}`);
      }
    }

    teacherIds.push(teacher._id);
    
    // Prepare teacher data for blockchain with proper teacherId and teacherName
    teachersForBlockchain.push({
      teacherId,
      teacherName
    });
  }

  // Register course and teachers on blockchain
  try {
    console.log(`🔗 Sending to blockchain with ${teachersForBlockchain.length} teacher(s)...`);
    const txHash = await createCourseblock({
      courseId: course.courseId,
      courseName: course.courseName,
      teachers: teachersForBlockchain  // Pass teacherId and teacherName directly
    });

    console.log(`✅ Course and teachers registered on blockchain with hash: ${txHash}`);
  } catch (blockchainError) {
    console.warn(`⚠️  Course created in MongoDB but blockchain registration failed:`, blockchainError.message);
    // Continue - course is in database even if blockchain fails
  }

  // Update course with teacher IDs
  const updatedCourse = await Course.findByIdAndUpdate(
    course._id,
    { $set: { teachers: teacherIds } },
    { new: true }
  ).populate('teachers');

  return res.status(201).json(
    new ApiResponse(201, updatedCourse, "Course created successfully with teachers stored in MongoDB")
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
        // Create a new object with only the essential course data
        const expandedCourse = {
          _id: course._id,
          courseId: course.courseId,
          courseName: course.courseName,
          branch: course.branch,
          courseTime: course.courseTime,
          blockchainTxHash: course.blockchainTxHash,
          blockchainBlockNumber: course.blockchainBlockNumber,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          // Only include THIS teacher in the teachers array
          teachers: [{
            _id: teacher._id,
            name: teacher.name,
            teacherId: teacher.teacherId,
            email: teacher.email
          }],
          // Add teacher info at top level too
          teacherId: teacher.teacherId,
          teacherName: teacher.name,
          teacherEmail: teacher.email || null,
        };
        console.log(`📚 Expanding course ${course.courseName} (ID: ${course.courseId}) - Teacher: ${teacher.name} (ID: ${teacher.teacherId})`);
        expandedCourses.push(expandedCourse);
      });
    } else {
      // If no teachers, add the course as-is
      expandedCourses.push(course.toObject());
    }
  });

  console.log(`✅ Total expanded courses: ${expandedCourses.length}`);
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
          teacherId: teacher.teacherId,  // ✅ Use teacher's teacherId (string like "T008"), not MongoDB _id
          teacherName: teacher.name,
          teacherEmail: teacher.email || null,
          teacherDbId: teacher._id,  // Keep MongoDB _id for reference
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
  getCoursesByBranch,
  getTeacherCourseResults
};

// Get feedback results for a specific teacher in a specific course
const getTeacherCourseResults = requestHandler(async (req, res) => {
  const { courseId, teacherId } = req.params;

  if (!courseId || !teacherId) {
    throw new ApiError(400, "courseId and teacherId are required");
  }

  console.log(`📊 Fetching results for course ${courseId}, teacher ${teacherId}`);

  try {
    // Get course from MongoDB
    const course = await Course.findOne({ courseId }).populate('teachers');
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    console.log(`✅ Course found:`, course.courseName);
    console.log(`📋 Teachers in course:`, course.teachers.map(t => ({ name: t.name, teacherId: t.teacherId })));

    // Find the specific teacher in the course
    const teacher = course.teachers.find(t => t.teacherId === teacherId);
    if (!teacher) {
      console.error(`❌ Teacher ${teacherId} not found. Available teachers:`, course.teachers.map(t => t.teacherId));
      throw new ApiError(404, `Teacher ${teacherId} not found in course ${courseId}`);
    }

    console.log(`✅ Teacher found: ${teacher.name} (${teacher.teacherId})`);

    // Get averages from blockchain - ensure courseId is a string
    let averages;
    try {
      const courseIdStr = String(courseId);
      const teacherIdStr = String(teacherId);
      console.log(`🔗 Calling blockchain with courseId=${courseIdStr} (string), teacherId=${teacherIdStr} (string)`);
      averages = await getTeacherCourseAveragesFromBlockchain(teacherIdStr, courseIdStr);
      console.log(`✅ Got averages from blockchain:`, averages);
    } catch (blockchainError) {
      console.error(`❌ Blockchain error:`, blockchainError.message);
      // Check if it's a "No feedback" error
      if (blockchainError.message.includes("No feedback")) {
        throw new ApiError(404, "No feedback available for this teacher-course combination yet");
      }
      throw blockchainError;
    }

    const ratingLabels = ['Teaching', 'Communication', 'Fairness', 'Engagement'];
    const ratingDetails = ratingLabels.map((label, index) => ({
      label,
      score: parseFloat(averages[index])
    }));

    const overallScore = ratingDetails.reduce((sum, item) => sum + item.score, 0) / ratingDetails.length;

    return res.status(200).json(
      new ApiResponse(200, {
        courseId,
        courseName: course.courseName,
        branch: course.branch,
        teacherId,
        teacherName: teacher.name,
        ratings: ratingDetails,
        overallScore: parseFloat(overallScore.toFixed(2))
      }, "Teacher course results retrieved successfully")
    );
  } catch (err) {
    console.error(`❌ Error in getTeacherCourseResults:`, err.message);
    throw err;
  }
});
