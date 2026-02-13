// src/services/blockchainService.js
import Web3 from 'web3';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const web3 = new Web3("http://127.0.0.1:7545");

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import your web3 library and contract ABI (You'd need to set these up first)
// Example using a hypothetical Web3 setup
 // Assuming you have a config for web3 provider
import { User } from '../models/user.model.js';
const FeedbackABIModule = require('../services/FeedbackABI.json');
// FeedbackABI.json is an array directly, not an object with .abi property
const FeedbackContractABI = Array.isArray(FeedbackABIModule) ? FeedbackABIModule : FeedbackABIModule.abi;
const contractAddress = '0x6Db6013a358Aab15Aa0f7538D61A97216E00460e'; // Replace with your deployed address

// Assuming you have a default account/wallet configured to send transactions
const adminAccount = '0x65c95dc7f2ae27ebdaedb2452f5e41bcb2792bc0';

// Initialize contract only if web3 is properly configured
let feedbackContract = null;
if (web3 && web3.eth) {
  feedbackContract = new web3.eth.Contract(FeedbackContractABI, contractAddress);
}

// Temporary storage for feedback data (not persisted to MongoDB)
let tempFeedbackStorage = [];

/**
 * Calls the addStudent function on the Feedback smart contract
 * @param {string} studentId - The ID to record on chain
 * @param {string} studentName - The name associated with the ID
 * @returns {Promise<string>} The transaction hash
 */
const addStudent = async (user) => {
  try {

    const studentName = user.fullName;
    const studentId = user._id.toString(); // Mongo ObjectId as studentId
   
    console.log(user._id, user.fullName);
    // This is where you interact with the EVM
    const receipt = await feedbackContract.methods.addStudent(studentId, studentName)
      .send({ from: adminAccount, gasLimit: 300000 }); // Estimate appropriate gas

    console.log('Transaction successful! Hash:', receipt.transactionHash);
    return receipt.transactionHash; // Return the hash for the controller to use

  } catch (error) {
    console.error('Error executing smart contract transaction:', error);
    // Re-throw the error so the controller can catch it and inform the user
    throw new Error(`Blockchain transaction failed: ${error.message}`);
  }
};

/**
 * Calls the addTeacher function on the Feedback smart contract
 * @param {string} teacherId - The teacher ID to register on blockchain
 * @param {string} teacherName - The teacher name to register on blockchain
 * @returns {Promise<string>} The transaction hash
 */
const addTeacher = async (teacherId, teacherName) => {
  try {
    if (!teacherId || !teacherName) {
      throw new Error("teacherId and teacherName are required");
    }

    const formattedTeacherId = teacherId.toString();
    const formattedTeacherName = teacherName.toString();

    console.log(`📝 Registering teacher on blockchain:`, {
      teacherId: formattedTeacherId,
      teacherName: formattedTeacherName
    });

    // Call addTeacher on blockchain
    const receipt = await feedbackContract.methods.addTeacher(formattedTeacherId, formattedTeacherName)
      .send({ from: adminAccount, gasLimit: 300000 });

    console.log('✅ Teacher registered on blockchain! Hash:', receipt.transactionHash);
    return receipt.transactionHash;

  } catch (error) {
    console.error('❌ Error registering teacher on blockchain:', error.message);
    throw new Error(`Failed to register teacher on blockchain: ${error.message}`);
  }
};

const createCourseblock = async (course) => {
  try {
    const courseId = course.courseId.toString();
    const courseName = course.courseName;
    const teachers = course.teachers; // ARRAY of teacher objects with teacherId and teacherName

    console.log(`📚 Creating course on blockchain:`, {
      courseId: courseId,
      courseName: courseName,
      teacherCount: teachers?.length || 0
    });

    // Register teachers on blockchain first
    if (Array.isArray(teachers) && teachers.length > 0) {
      console.log(`📝 Registering ${teachers.length} teacher(s) on blockchain...`);
      
      for (const teacher of teachers) {
        try {
          const teacherId = teacher.teacherId.toString().trim();
          const teacherName = teacher.teacherName.toString().trim();
          
          console.log(`   - Registering teacher: ${teacherName} (ID: ${teacherId})`);
          await addTeacher(teacherId, teacherName);
          console.log(`   ✅ Teacher registered on blockchain successfully`);
        } catch (error) {
          console.warn(`   ⚠️  Could not register teacher on blockchain, continuing:`, error.message);
          // Continue with course creation even if teacher registration fails
        }
      }
    }

    // Add course on blockchain
    console.log(`🔗 Adding course to blockchain...`);
    const receipt = await feedbackContract.methods
      .addCourse(courseId, courseName)
      .send({
        from: adminAccount,
        gas: 300000
      });

    console.log("✅ Course added to blockchain:", receipt.transactionHash);

    // Assign ALL teachers to this course on blockchain
    if (Array.isArray(teachers) && teachers.length > 0) {
      console.log(`🔗 Assigning ${teachers.length} teacher(s) to course...`);
      
      for (const teacher of teachers) {
        try {
          const teacherId = teacher.teacherId.toString().trim();
          
          await feedbackContract.methods
            .assignTeacherToCourse(courseId, teacherId)
            .send({
              from: adminAccount,
              gas: 200000
            });

          console.log(`   ✅ Teacher ${teacherId} assigned to course ${courseId}`);
        } catch (error) {
          console.warn(`   ⚠️  Could not assign teacher to course:`, error.message);
          // Continue even if assignment fails
        }
      }
    }

    console.log(`✅ Course creation completed with hash:`, receipt.transactionHash);
    return receipt.transactionHash;

  } catch (error) {
    console.error("❌ Blockchain createCourse error:", error.message);
    throw new Error(`Blockchain error: ${error.message}`);
  }
};

import requestHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Core function to submit feedback (can be called directly)
const submitFeedbackLogic = async (feedbackData) => {
  const {
    studentId,
    courseId,
    teacherId,
    ratings,
    comments,
    feedbackDetails
  } = feedbackData;

  console.log('DEBUG: submitFeedbackLogic received:', {
    studentId,
    courseId,
    teacherId,
    ratings,
    comments,
    feedbackDetails
  });

  if (!studentId || !courseId || !teacherId || !ratings || ratings.length !== 4) {
    throw new ApiError(400, "studentId, courseId, teacherId and 4 ratings required");
  }

  // Store feedback in temporary variable (not in MongoDB)
  const tempFeedback = {
    studentId: studentId,
    courseId: courseId,
    teacherId: teacherId,
    ratings: ratings,
    comments: comments || "",
    feedbackDetails: feedbackDetails || {},
    storedAt: new Date().toISOString(),
    processed: false
  };

  // Add to temporary storage
  tempFeedbackStorage.push(tempFeedback);

  console.log('Feedback stored in temporary variable:', tempFeedback);
  console.log('Current temporary storage count:', tempFeedbackStorage.length);

  const formattedRatings = ratings.map(r => Number(r));

  try {
    console.log(`🔗 Submitting feedback to blockchain with:`);
    console.log(`   Student ID: ${studentId}`);
    console.log(`   Teacher ID: ${teacherId}`);
    console.log(`   Course ID: ${courseId}`);
    console.log(`   Ratings: ${formattedRatings.join(', ')}`);

    const receipt = await feedbackContract.methods
      .submitFeedback(
        studentId.toString(),
        teacherId.toString(),
         courseId.toString(),
       formattedRatings,
        comments || ""
      )
      .send({
        from: process.env.ADMIN_WALLET || adminAccount,
        gas: 500000
      });

    // Mark feedback as processed in temporary storage
    tempFeedback.processed = true;
    tempFeedback.transactionHash = receipt.transactionHash;

    console.log('Feedback submitted to blockchain. Tx Hash:', receipt.transactionHash);

    return {
      txHash: receipt.transactionHash,
      tempStorageId: tempFeedbackStorage.length - 1,
      feedbackStored: true
    };

  } catch (error) {
    console.error('Error submitting feedback to blockchain:', error);
    throw new ApiError(500, `Blockchain submission failed: ${error.message}`);
  }
};

// Route handler wrapper
const submitFeedback = requestHandler(async (req, res) => {
  const result = await submitFeedbackLogic(req.body);
  return res.status(200).json(
    new ApiResponse(200, result, "Feedback submitted successfully and stored in temporary variable")
  );
});
// Get teacher course averages from blockchain
const getTeacherCourseAveragesFromBlockchain = async (teacherId, courseId) => {
  try {
    if (!feedbackContract) {
      throw new Error("Feedback contract not initialized");
    }

    console.log(`📊 Fetching averages for teacher ${teacherId}, course ${courseId}`);
    
    // Call the smart contract function
    let averages;
    try {
      averages = await feedbackContract.methods
        .getTeacherCourseAverages(teacherId, courseId)
        .call();
    } catch (contractError) {
      console.error(`❌ Smart contract call failed:`, contractError.message);
      // Check if it's a revert reason message
      if (contractError.message.includes("No feedback") || contractError.message.includes("revert")) {
        const error = new Error("No feedback");
        throw error;
      }
      throw contractError;
    }

    console.log(`✅ Retrieved averages:`, averages);
    
    return averages;
  } catch (error) {
    console.error(`❌ Error fetching teacher course averages:`, error.message);
    throw error;
  }
};

// Get all feedbacks from blockchain (for debugging)
const getAllFeedbacksFromBlockchain = async () => {
  try {
    if (!feedbackContract) {
      throw new Error("Feedback contract not initialized");
    }

    console.log(`📊 Fetching all feedbacks from blockchain...`);
    
    const feedbacks = await feedbackContract.methods
      .getAllFeedbacks()
      .call();

    console.log(`✅ Retrieved ${feedbacks.length} feedbacks:`, feedbacks);
    
    return feedbacks;
  } catch (error) {
    console.error(`❌ Error fetching all feedbacks:`, error.message);
    throw error;
  }
};

// Get temporary feedback storage (for debugging/admin purposes)
const getTempFeedbackStorage = requestHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, {
      totalFeedback: tempFeedbackStorage.length,
      feedbackList: tempFeedbackStorage
    }, "Temporary feedback storage retrieved")
  );
});

// Clear temporary feedback storage
const clearTempFeedbackStorage = requestHandler(async (req, res) => {
  const clearedCount = tempFeedbackStorage.length;
  tempFeedbackStorage = [];
  return res.status(200).json(
    new ApiResponse(200, {
      clearedCount: clearedCount
    }, "Temporary feedback storage cleared")
  );
});

export { addStudent, addTeacher, createCourseblock, submitFeedback, submitFeedbackLogic, getTempFeedbackStorage, clearTempFeedbackStorage, getTeacherCourseAveragesFromBlockchain, getAllFeedbacksFromBlockchain };