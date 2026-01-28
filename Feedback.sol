// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FeedbackSystem {

    address public admin;
    uint256 private feedbackIdCounter;

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
        uint8[4] ratings;
        uint256 finalScore;
        string comments;
        uint256 timestamp;
    }

    mapping(string => Student) public students;
    mapping(string => Teacher) public teachers;

    Feedback[] public feedbacks;

    event StudentAdded(string indexed studentId, string name);
    event TeacherAdded(string indexed teacherId, string name);
    event FeedbackSubmitted(uint256 indexed id, string indexed facultyId, string studentId);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0));
        emit AdminChanged(admin, _newAdmin);
        admin = _newAdmin;
    }

    // ADMIN FUNCTIONS

    function addStudent(string memory _studentId, string memory _name)
        external onlyAdmin
    {
        require(!students[_studentId].isRegistered, "Student exists");

        students[_studentId] = Student(_studentId, _name, true);

        emit StudentAdded(_studentId, _name);
    }

    function addTeacher(string memory _teacherId, string memory _name)
        external onlyAdmin
    {
        require(!teachers[_teacherId].isRegistered, "Teacher exists");

        teachers[_teacherId] = Teacher(_teacherId, _name, true);

        emit TeacherAdded(_teacherId, _name);
    }

    // FEEDBACK (Backend calls this after student login)

    function submitFeedback(
        string memory _studentId,
        string memory _facultyId,
        uint8[4] memory _ratings,
        string memory _comments
    ) external onlyAdmin {

        require(students[_studentId].isRegistered, "Student not registered");
        require(teachers[_facultyId].isRegistered, "Teacher not found");

        uint256 score = 0;

        for(uint i = 0; i < 4; i++) {
            require(_ratings[i] >= 1 && _ratings[i] <= 5);
            score += _ratings[i];
        }

        feedbackIdCounter++;

        feedbacks.push(
            Feedback(
                feedbackIdCounter,
                _studentId,
                _facultyId,
                _ratings,
                score,
                _comments,
                block.timestamp
            )
        );

        emit FeedbackSubmitted(feedbackIdCounter, _facultyId, _studentId);
    }

    function getAllFeedbacks() external view returns (Feedback[] memory) {
        return feedbacks;
    }

    function isStudent(string memory _studentId) external view returns (bool) {
        return students[_studentId].isRegistered;
    }
}
