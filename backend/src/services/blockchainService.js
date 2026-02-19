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
const contractAddress = process.env.CONTRACT_ADDRESS || '0x4758cbf7cc98D0F39D1D46E34Aed0E2f5ef043c3'; // Replace with your deployed address
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "23ceubg1@ddu.ac.in";

if (process.env.ADMIN_PRIVATE_KEY) {
  const normalizedKey = process.env.ADMIN_PRIVATE_KEY.startsWith("0x")
    ? process.env.ADMIN_PRIVATE_KEY
    : `0x${process.env.ADMIN_PRIVATE_KEY}`;
  web3.eth.accounts.wallet.add(normalizedKey);
}

// Assuming you have a default account/wallet configured to send transactions


// Initialize contract only if web3 is properly configured
let feedbackContract = null;
if (web3 && web3.eth) {
  feedbackContract = new web3.eth.Contract(FeedbackContractABI, contractAddress);
}

// Temporary storage for feedback data (not persisted to MongoDB)
let tempFeedbackStorage = [];

const resolveAdminWalletAddress = async () => {
  if (process.env.ADMIN_WALLET) {
    return process.env.ADMIN_WALLET.toLowerCase();
  }

  const adminUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() }).select("walletAddress");
  return adminUser?.walletAddress ? adminUser.walletAddress.toLowerCase() : null;
};

const requireAdminWalletAddress = async () => {
  const adminWallet = await resolveAdminWalletAddress();
  if (!adminWallet) {
    throw new Error("Admin wallet not set. Connect the admin wallet first.");
  }
  return adminWallet;
};

const resolvePreferredSender = async (preferredAddress, label = "Sender") => {
  if (!preferredAddress) {
    throw new Error(`${label} address is required`);
  }

  const normalized = preferredAddress.toLowerCase();
  const localAccounts = await web3.eth.getAccounts();
  const hasLocal = localAccounts.some((addr) => addr.toLowerCase() === normalized);
  const hasWallet = Boolean(web3.eth.accounts.wallet.get(normalized));

  if (hasLocal || hasWallet) {
    return normalized;
  }

  throw new Error(
    `${label} not available in the node. Import this account into Ganache or set ADMIN_PRIVATE_KEY for the backend.`
  );
};

const resolveOnChainAdmin = async () => {
  if (!feedbackContract) {
    throw new Error("Feedback contract not initialized");
  }
  const admin = await feedbackContract.methods.admin().call();
  return admin?.toLowerCase();
};

const resolveAdminSender = async () => {
  const onChainAdmin = await resolveOnChainAdmin();
  return resolvePreferredSender(onChainAdmin, "On-chain admin");
};

const resolveAdminCaller = async () => {
  const onChainAdmin = await resolveOnChainAdmin();
  if (!onChainAdmin) {
    throw new Error("On-chain admin address not found");
  }
  return onChainAdmin;
};

const ensureAdminSender = async (providedAddress = null) => {
  let adminSender = await resolveAdminSender();

  if (providedAddress && providedAddress.toLowerCase() !== adminSender.toLowerCase()) {
    try {
      await ensureAdminOnChain(providedAddress);
      adminSender = await resolveAdminSender();
    } catch (error) {
      throw new Error(`Only on-chain admin wallet can perform this action: ${error.message}`);
    }
  }

  return adminSender;
};

const ensureAdminOnChain = async (newAdminWallet) => {
  if (!feedbackContract) {
    throw new Error("Feedback contract not initialized");
  }

  if (!feedbackContract.methods?.admin || !feedbackContract.methods?.changeAdmin) {
    throw new Error("Contract ABI missing admin/changeAdmin. Redeploy with changeAdmin and update ABI.");
  }

  const normalizedWallet = newAdminWallet?.toLowerCase();
  if (!normalizedWallet) {
    throw new Error("Admin wallet address is required");
  }

  const currentAdmin = await resolveOnChainAdmin();
  if (currentAdmin === normalizedWallet) {
    return { updated: false, currentAdmin };
  }

  const sender = await resolvePreferredSender(currentAdmin, "On-chain admin");
  const receipt = await feedbackContract.methods.changeAdmin(normalizedWallet).send({
    from: sender,
    gas: 200000
  });

  return {
    updated: true,
    previousAdmin: currentAdmin,
    newAdmin: normalizedWallet,
    txHash: receipt.transactionHash
  };
};

/**
 * Calls the addStudent function on the Feedback smart contract
 * @param {string} walletAddress - The wallet address to register
 * @param {string} studentName - The name associated with the wallet
 * @param {string} [fromWallet] - Optional sender wallet for the transaction
 * @returns {Promise<string>} The transaction hash
 */
const addStudent = async (walletAddress, studentName, fromWallet = null) => {
  try {
    if (!feedbackContract) {
      throw new Error("Feedback contract not initialized");
    }

    if (!walletAddress) {
      throw new Error("walletAddress is required");
    }

    const normalizedWallet = walletAddress.toLowerCase();

    console.log(`📝 Registering student on blockchain:`, {
      wallet: normalizedWallet,
      name: studentName
    });

    if (feedbackContract.methods?.isStudentRegistered) {
      const alreadyRegistered = await feedbackContract.methods
        .isStudentRegistered(normalizedWallet)
        .call();

      if (alreadyRegistered) {
        console.log('ℹ️ Student already registered on blockchain, skipping addStudent transaction');
        return null;
      }
    }

    // Call smart contract addStudent(wallet, name)
    let senderWallet = null;

    if (fromWallet) {
      try {
        senderWallet = await resolvePreferredSender(fromWallet, "Student sender");
      } catch (senderError) {
        console.warn(`⚠️ ${senderError.message}. Falling back to admin sender.`);
      }
    }

    if (!senderWallet) {
      senderWallet = await resolveAdminSender();
    }

    const receipt = await feedbackContract.methods.addStudent(normalizedWallet, studentName)
      .send({ from: senderWallet, gas: 300000 });

    console.log('✅ Student registered on blockchain! Hash:', receipt.transactionHash);
    return receipt.transactionHash;

  } catch (error) {
    const lowerMessage = (error?.message || '').toLowerCase();

    if (lowerMessage.includes('student already registered') || lowerMessage.includes('already registered')) {
      console.log('ℹ️ Student already registered on blockchain (from tx revert), continuing without failure');
      return null;
    }

    console.error('❌ Error executing smart contract transaction:', error);
    throw new Error(`Blockchain transaction failed: ${error.message}`);
  }
};

/**
 * Calls the addTeacher function on the Feedback smart contract
 * @param {string} teacherId - The teacher ID to register on blockchain
 * @param {string} teacherName - The teacher name to register on blockchain
 * @returns {Promise<string>} The transaction hash
 */
const addTeacher = async (teacherId, teacherName, fromWallet = null) => {
  try {
    if (!feedbackContract) {
      throw new Error("Feedback contract not initialized");
    }

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
    const adminWallet = await ensureAdminSender(fromWallet);
    const receipt = await feedbackContract.methods.addTeacher(formattedTeacherId, formattedTeacherName)
      .send({ from: adminWallet, gasLimit: 300000 });

    console.log('✅ Teacher registered on blockchain! Hash:', receipt.transactionHash);
    return receipt.transactionHash;

  } catch (error) {
    console.error('❌ Error registering teacher on blockchain:', error.message);
    throw new Error(`Failed to register teacher on blockchain: ${error.message}`);
  }
};

const createCourseblock = async (course, fromWallet = null) => {
  try {
    if (!feedbackContract) {
      throw new Error("Feedback contract not initialized");
    }

    const courseId = course.courseId.toString();
    const courseName = course.courseName;
    const teachers = course.teachers; // ARRAY of teacher objects with teacherId and teacherName

    console.log(`📚 Creating course on blockchain:`, {
      courseId: courseId,
      courseName: courseName,
      teacherCount: teachers?.length || 0
    });

    // Check if course already exists on blockchain
    try {
      const existingCourse = await feedbackContract.methods.courses(courseId).call();
      const exists = existingCourse.exists ?? existingCourse[2];
      if (exists) {
        throw new Error(`Course ${courseId} already exists on blockchain. Please use a different Course ID or restart Ganache.`);
      }
    } catch (error) {
      // If error is our custom message, throw it
      if (error.message.includes('already exists')) {
        throw error;
      }
      // Otherwise, course doesn't exist (which is good), continue
      console.log(`✅ Course ${courseId} does not exist yet, proceeding...`);
    }

    // Register teachers on blockchain first
    if (Array.isArray(teachers) && teachers.length > 0) {
      console.log(`📝 Registering ${teachers.length} teacher(s) on blockchain...`);
      
      for (const teacher of teachers) {
        try {
          const teacherId = teacher.teacherId.toString().trim();
          const teacherName = teacher.teacherName.toString().trim();
          
          console.log(`   - Registering teacher: ${teacherName} (ID: ${teacherId})`);
          await addTeacher(teacherId, teacherName, fromWallet);
          console.log(`   ✅ Teacher registered on blockchain successfully`);
        } catch (error) {
          console.warn(`   ⚠️  Could not register teacher on blockchain, continuing:`, error.message);
          // Continue with course creation even if teacher registration fails
        }
      }
    }

    // Add course on blockchain
    console.log(`🔗 Adding course to blockchain...`);
    const adminWallet = await ensureAdminSender(fromWallet);
    const receipt = await feedbackContract.methods
      .addCourse(courseId, courseName)
      .send({
        from: adminWallet,
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
              from: adminWallet,
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
    walletAddress,
    senderWalletAddress,
    courseId,
    teacherId,
    ratings,
    comments,
    feedbackDetails
  } = feedbackData;

  console.log('DEBUG: submitFeedbackLogic received:', {
    walletAddress,
    courseId,
    teacherId,
    ratings,
    comments,
    feedbackDetails
  });

  if (!walletAddress || !courseId || !teacherId || !ratings || ratings.length !== 4) {
    throw new ApiError(400, "walletAddress, courseId, teacherId and 4 ratings required");
  }

  // Store feedback in temporary variable (not in MongoDB)
  const tempFeedback = {
    walletAddress: walletAddress,
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
    console.log(`   Student Wallet: ${walletAddress}`);
    console.log(`   Teacher ID: ${teacherId}`);
    console.log(`   Course ID: ${courseId}`);
    console.log(`   Ratings: ${formattedRatings.join(', ')}`);

    const adminWallet = await resolveAdminWalletAddress();
    const receipt = await feedbackContract.methods
      .submitFeedback(
        walletAddress,
        teacherId.toString(),
        courseId.toString(),
        formattedRatings,
        comments || ""
      )
      .send({
        from: senderWalletAddress || walletAddress || adminWallet,
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
        .call({ from: await resolveAdminCaller() });
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
      .call({ from: await resolveAdminCaller() });

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

// Get course details from blockchain
const getCourseFromBlockchain = async (courseId) => {
  try {
    if (!feedbackContract) {
      throw new Error("Feedback contract not initialized");
    }

    console.log(`📚 Fetching course ${courseId} from blockchain...`);
    
    // Call the public courses mapping
    const course = await feedbackContract.methods.courses(courseId).call();
    
    // Handle both indexed and named returns from struct
    const exists = course.exists ?? course[2];
    
    if (!exists) {
      throw new Error(`Course ${courseId} not found on blockchain`);
    }

    // Get teachers assigned to this course
    const teacherIds = await feedbackContract.methods.courseTeacherList(courseId, 0).call();
    
    // Fetch teacher details for each teacherId
    const teachers = [];
    
    // courseTeacherList returns one teacher at a time, we need to loop through indices
    let index = 0;
    const teacherList = [];
    try {
      while (true) {
        const teacherId = await feedbackContract.methods.courseTeacherList(courseId, index).call();
        if (teacherId) {
          teacherList.push(teacherId);
          index++;
        } else {
          break;
        }
      }
    } catch (e) {
      // End of array reached
    }
    
    for (const teacherId of teacherList) {
      try {
        const teacher = await feedbackContract.methods.teachers(teacherId).call();
        const isRegistered = teacher.isRegistered ?? teacher[2];
        if (isRegistered) {
          teachers.push({
            teacherId: teacher.teacherId ?? teacher[0],
            teacherName: teacher.name ?? teacher[1]
          });
        }
      } catch (err) {
        console.warn(`Could not fetch teacher ${teacherId}:`, err.message);
      }
    }

    // Handle both named and indexed struct properties
    const courseData = {
      courseId: course.courseId ?? course[0],
      courseName: course.courseName ?? course[1]
    };

    console.log(`✅ Retrieved course from blockchain:`, courseData.courseName);
    
    return {
      courseId: courseData.courseId,
      courseName: courseData.courseName,
      teachers: teachers
    };
  } catch (error) {
    console.error(`❌ Error fetching course from blockchain:`, error.message);
    throw error;
  }
};

// Get all courses from blockchain (Note: This requires maintaining a list of course IDs)
// Since Solidity mappings can't be iterated, you'll need to track course IDs separately
// For now, this returns an empty array - you should maintain courseIds in your contract
const getCoursesFromBlockchain = async (courseIds = []) => {
  try {
    if (!feedbackContract) {
      throw new Error("Feedback contract not initialized");
    }

    console.log(`📚 Fetching courses from blockchain...`);
    
    // If no courseIds provided, fetch all from blockchain
    let coursesToFetch = courseIds;
    if (!coursesToFetch || coursesToFetch.length === 0) {
      console.log(`📋 Fetching all course IDs from blockchain...`);
      coursesToFetch = await feedbackContract.methods.getAllCourseIds().call();
      console.log(`📋 Found ${coursesToFetch.length} course(s) on blockchain`);
    }
    
    const courses = [];
    
    // Fetch each course by ID
    for (const courseId of coursesToFetch) {
      try {
        const course = await getCourseFromBlockchain(courseId);
        courses.push(course);
      } catch (error) {
        console.warn(`⚠️ Could not fetch course ${courseId}:`, error.message);
      }
    }

    console.log(`✅ Retrieved ${courses.length} courses from blockchain`);
    
    return courses;
  } catch (error) {
    console.error(`❌ Error fetching courses from blockchain:`, error.message);
    throw error;
  }
};

// Get teachers assigned to a course
const getCourseTeachersFromBlockchain = async (courseId) => {
  try {
    if (!feedbackContract) {
      throw new Error("Feedback contract not initialized");
    }

    console.log(`📚 Fetching teachers for course ${courseId} from blockchain...`);
    
    const teacherIds = await feedbackContract.methods.courseTeacherList(courseId).call();
    
    const teachers = [];
    for (const teacherId of teacherIds) {
      const teacher = await feedbackContract.methods.teachers(teacherId).call();
      if (teacher.isRegistered) {
        teachers.push({
          teacherId: teacher.teacherId,
          teacherName: teacher.name
        });
      }
    }

    console.log(`✅ Retrieved ${teachers.length} teachers for course ${courseId}`);
    
    return teachers;
  } catch (error) {
    console.error(`❌ Error fetching course teachers from blockchain:`, error.message);
    throw error;
  }
};

export { addStudent, addTeacher, createCourseblock, submitFeedback, submitFeedbackLogic, getTempFeedbackStorage, clearTempFeedbackStorage, getTeacherCourseAveragesFromBlockchain, getAllFeedbacksFromBlockchain, getCourseFromBlockchain, getCoursesFromBlockchain, getCourseTeachersFromBlockchain, ensureAdminOnChain };