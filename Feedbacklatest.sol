// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FeedbackSystem {

    address public admin;
    uint256 private feedbackIdCounter;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    struct Student {
        string studentId;
        string name;
        bool isRegistered;
    }

    struct Teacher {
        string teacherId;
        string name;
        bool isRegistered;
    }

    struct Feedback {
        uint256 id;
        string studentId;
        string facultyId;
        string courseId;
        uint8[4] ratings;
        uint256 totalScore;
        string comments;
        uint256 timestamp;
    }

    struct Stats {
        uint256 totalScore;
        uint256 feedbackCount;
    }

    mapping(string => Student) public students;
    mapping(string => Teacher) public teachers;

    Feedback[] public feedbacks;

    // facultyId => courseId => stats
    mapping(string => mapping(string => Stats)) public teacherCourseStats;

    // studentId => facultyId => courseId => submitted?
    mapping(string => mapping(string => mapping(string => bool))) public hasSubmitted;

    event StudentAdded(string studentId, string name);
    event TeacherAdded(string teacherId, string name);
    event FeedbackSubmitted(uint256 id, string facultyId, string studentId);

    function addStudent(string memory _studentId, string memory _name)
        external onlyAdmin
    {
        students[_studentId] = Student(_studentId, _name, true);
        emit StudentAdded(_studentId, _name);
    }

    function addTeacher(string memory _teacherId, string memory _name)
        external onlyAdmin
    {
        teachers[_teacherId] = Teacher(_teacherId, _name, true);
        emit TeacherAdded(_teacherId, _name);
    }

    function submitFeedback(
        string memory _studentId,
        string memory _facultyId,
        string memory _courseId,
        uint8[4] memory _ratings,
        string memory _comments
    ) external  {

        require(students[_studentId].isRegistered, "Student not registered");
        require(teachers[_facultyId].isRegistered, "Teacher not found");
        require(!hasSubmitted[_studentId][_facultyId][_courseId], "Already submitted");

        uint256 score;

        for(uint i=0;i<4;i++){
            require(_ratings[i]>=1 && _ratings[i]<=5);
            score += _ratings[i];
        }

        feedbackIdCounter++;

        feedbacks.push(
            Feedback(
                feedbackIdCounter,
                _studentId,
                _facultyId,
                _courseId,
                _ratings,
                score,
                _comments,
                block.timestamp
            )
        );

        hasSubmitted[_studentId][_facultyId][_courseId] = true;

        teacherCourseStats[_facultyId][_courseId].totalScore += score;
        teacherCourseStats[_facultyId][_courseId].feedbackCount++;

        emit FeedbackSubmitted(feedbackIdCounter, _facultyId, _studentId);
    }

    // ================= RESULTS =================

    function getTeacherCourseAverage(
        string memory facultyId,
        string memory courseId
    ) external view returns(uint256){

        Stats memory stats = teacherCourseStats[facultyId][courseId];

        require(stats.feedbackCount>0,"No feedback");

        return stats.totalScore / stats.feedbackCount;
    }

    function getAllFeedbacks() external view returns(Feedback[] memory){
        return feedbacks;
    }
}
