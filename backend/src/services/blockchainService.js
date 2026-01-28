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
const contractAddress = '0xdEe3308326dE9EB200554FC6E469836CB9beAB4d'; // Replace with your deployed address

// Assuming you have a default account/wallet configured to send transactions
const adminAccount = '0x6c5f90893919e75CBC51A3456f11F3E94B1022ce';

// Initialize contract only if web3 is properly configured
let feedbackContract = null;
if (web3 && web3.eth) {
  feedbackContract = new web3.eth.Contract(FeedbackContractABI, contractAddress);
}


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


const createCourseblock = async (course) => {
  try {
const courseId = course.courseId.toString();
    const courseName = course.courseName;
    const teachers = course.teachers; // ARRAY of teacherIds    


    // Add course on blockchain
    const receipt = await feedbackContract.methods
      .addCourse(courseId, courseName)
      .send({
        from: adminAccount,
        gas: 300000
      });

    console.log("Course added:", receipt.transactionHash);

    // Assign ALL teachers to this course
    if (Array.isArray(teachers)) {
      for (const teacherId of teachers) {
        await feedbackContract.methods
          .assignTeacherToCourse(courseId, teacherId)
          .send({
            from: adminAccount,
            gas: 200000
          });

        console.log(`Teacher ${teacherId} assigned to ${courseId}`);
      }
    }

    return receipt.transactionHash;

  } catch (error) {
    console.error("Blockchain createCourse error:", error);
    throw new Error(`Blockchain error: ${error.message}`);
  }
};


export { addStudent, createCourseblock };