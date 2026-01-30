# Feedback Submission Flow Implementation

## Overview
This document describes the complete feedback submission flow from frontend to backend with temporary variable storage in the blockchain service.

---

## Flow Architecture

### 1. **Frontend (FeedbackModal.jsx)**
- Student fills out feedback form with ratings and comments
- **Temp Variable Created**: `feedbackData` object stores:
  - `ratings` (teaching, comms, fairness, engage)
  - `comment` (student's additional comments)
  - `submittedAt` (timestamp)

```javascript
const feedbackData = {
  ratings,
  comment,
  submittedAt: new Date().toISOString()
};
```

---

### 2. **Frontend (App.jsx)**
- Receives feedback from modal
- **Temp Variable Created**: `tempFeedbackData` object stores:
  ```javascript
  const tempFeedbackData = {
    ratings: {
      teaching: ratings.teaching,
      communication: ratings.comms,
      fairness: ratings.fairness,
      engagement: ratings.engage
    },
    comment: comment,
    submittedAt: new Date().toISOString()
  };
  ```

- Simulates blockchain process (hashing, encrypting, consensus)
- Sends feedback to backend with all details:
  - `courseId`, `courseName`
  - `studentId`
  - `teacherId`
  - `ratings` array: [teaching, communication, fairness, engagement]
  - `comments` (encrypted comments)
  - `feedbackData` (the temp variable object)
  - `feedbackTypes` (boolean indicators)

---

### 3. **Backend - User Controller (user.controllers.js)**
- Receives feedback submission via POST `/api/v1/user/submit-feedback`
- **Parameters extracted**:
  ```javascript
  const { 
    courseId, 
    courseName, 
    feedbackTypes, 
    teacherId, 
    studentId, 
    ratings, 
    comments, 
    feedbackData 
  } = req.body;
  ```

- **Process**:
  1. Verifies user exists
  2. Checks if feedback already submitted for course
  3. Saves feedback submission tracking to MongoDB (with boolean indicators)
  4. Calls blockchain service `submitFeedback()` with all data including temp variable

---

### 4. **Backend - Blockchain Service (blockchainService.js)**
- **Temporary Storage System**:
  ```javascript
  // Global temporary array (not persisted to MongoDB)
  let tempFeedbackStorage = [];
  ```

- **submitFeedback() function**:
  - Receives feedback data from controller
  - **Creates temp variable**:
    ```javascript
    const tempFeedback = {
      studentId: studentId,
      courseId: courseId,
      facultyId: facultyId || teacherId,
      ratings: ratings,
      comments: comments || "",
      feedbackDetails: feedbackData || {},
      storedAt: new Date().toISOString(),
      processed: false
    };
    ```

  - **Stores in temporary variable** (NOT MongoDB):
    ```javascript
    tempFeedbackStorage.push(tempFeedback);
    ```

  - Logs feedback storage for debugging:
    ```javascript
    console.log('Feedback stored in temporary variable:', tempFeedback);
    console.log('Current temporary storage count:', tempFeedbackStorage.length);
    ```

  - Submits to smart contract on blockchain
  - Updates temp feedback with transaction hash and marks as processed

- **Additional Functions**:
  - `getTempFeedbackStorage()`: Retrieve all temp feedback
  - `clearTempFeedbackStorage()`: Clear the temporary storage

---

## Data Flow Diagram

```
FRONTEND
┌─────────────────────────────────────────────┐
│ FeedbackModal.jsx                           │
│ - Temp Variable: feedbackData               │
│   (ratings, comment, submittedAt)           │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ App.jsx                                     │
│ - Temp Variable: tempFeedbackData           │
│   (ratings obj, comment, submittedAt)       │
│ - Sends to backend with all details         │
└────────────┬────────────────────────────────┘
             │ POST /api/v1/user/submit-feedback
             ▼
BACKEND
┌─────────────────────────────────────────────┐
│ user.controllers.js                         │
│ submitFeedbackTracking()                    │
│ - Receives feedbackData from req.body       │
│ - Saves tracking to MongoDB                 │
│ - Calls blockchainService.submitFeedback() │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ blockchainService.js                        │
│ submitFeedback()                            │
│ - Temp Variable: tempFeedback               │
│   (studentId, courseId, ratings, etc)       │
│ - Stores in tempFeedbackStorage array       │
│   (NOT MongoDB)                             │
│ - Submits to smart contract                 │
│ - Returns transaction hash                  │
└──────────────────────────────────────────────┘
```

---

## API Endpoints

### Submit Feedback (POST)
```
POST /api/v1/user/submit-feedback
Headers: Authorization: Bearer {token}
Body: {
  courseId: string,
  courseName: string,
  studentId: string,
  teacherId: string,
  ratings: [number, number, number, number],
  comments: string,
  feedbackData: object,
  feedbackTypes: object
}
```

### Get Temporary Feedback Storage (GET) - Admin
```
GET /api/v1/user/temp-feedback-storage
Headers: Authorization: Bearer {token}
Response: {
  totalFeedback: number,
  feedbackList: array
}
```

### Clear Temporary Feedback Storage (DELETE) - Admin
```
DELETE /api/v1/user/clear-temp-storage
Headers: Authorization: Bearer {token}
Response: {
  clearedCount: number
}
```

---

## Key Features

✅ **Frontend Temp Variable**: Feedback stored in memory before transmission  
✅ **Backend Temp Variable**: Feedback stored in temporary array, NOT persisted to MongoDB  
✅ **Full Data Flow**: All feedback details passed through the chain  
✅ **Blockchain Integration**: Submits to smart contract after temp storage  
✅ **Debugging Support**: Functions to view and clear temporary storage  
✅ **Error Handling**: Proper validation and error responses  

---

## Important Notes

1. **Temporary Storage**: The `tempFeedbackStorage` array is kept in memory and will be cleared when the server restarts.
2. **MongoDB Tracking**: Course feedback submission is tracked in MongoDB for user history.
3. **Blockchain Submission**: Feedback is submitted to the smart contract for immutable record-keeping.
4. **No Duplication**: MongoDB only stores boolean indicators of submission, not the actual ratings/comments.
5. **Admin Access**: Temporary storage can be viewed and cleared via admin endpoints.

---

## Files Modified

1. **frontend/src/components/FeedbackModal.jsx** - Added temp variable for feedback data
2. **frontend/src/App.jsx** - Enhanced to store and send complete feedback data
3. **backend/src/services/blockchainService.js** - Added temp storage system and updated submitFeedback()
4. **backend/src/controllers/user.controllers.js** - Updated to pass feedback to blockchain service
5. **backend/src/routes/user.route.js** - Added routes for temp storage management

---

## Testing the Flow

1. Submit feedback from student dashboard
2. Check console logs to verify temp variable storage
3. Access `/api/v1/user/temp-feedback-storage` to view stored feedback
4. Verify blockchain transaction hash is returned
5. Clear temp storage when needed via `/api/v1/user/clear-temp-storage`
