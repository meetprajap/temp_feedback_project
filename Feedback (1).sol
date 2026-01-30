// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FeedbackSystem {
    address public admin;
    uint256 private feedbackIdCounter;

    struct Student {
        string studentId;
        string name;
        address walletAddress;
        bool isRegistered;
    }

    struct Teacher {
        string teacherId;
        string name;
        bool isRegistered;
    }

    struct Feedback {
        uint256 id;
        string facultyId;
        uint8[4] ratings; // Array of 4 ratings
        uint256 finalScore;
        string comments;
        uint256 timestamp;
    }

    mapping(address => Student) public students;
    
    mapping(string => Teacher) public teachers;
    
    Feedback[] public feedbacks;

    event StudentAdded(address indexed wallet, string name, string studentId);
    event TeacherAdded(string indexed teacherId, string name);
    event FeedbackSubmitted(uint256 indexed id, string indexed facultyId, uint256 finalScore);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Access Denied: Only Admin can perform this action");
        _;
    }

    modifier onlyStudent() {
        require(students[msg.sender].isRegistered, "Access Denied: You are not a registered student");
        _;
    }

    constructor() {
        admin = msg.sender; 
    }

    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        emit AdminChanged(admin, _newAdmin);
        admin = _newAdmin;
    }

    function addStudent(string memory _name, string memory _studentId, address _walletAddress) external onlyAdmin {
        require(!students[_walletAddress].isRegistered, "Student wallet already registered");
        
        students[_walletAddress] = Student({
            studentId: _studentId,
            name: _name,
            walletAddress: _walletAddress,
            isRegistered: true
        });

        emit StudentAdded(_walletAddress, _name, _studentId);
    }

    function addTeacher(string memory _teacherId, string memory _name) external onlyAdmin {
        require(!teachers[_teacherId].isRegistered, "Teacher ID already exists");

        teachers[_teacherId] = Teacher({
            teacherId: _teacherId,
            name: _name,
            isRegistered: true
        });

        emit TeacherAdded(_teacherId, _name);
    }

    //  STUDENT FUNCTIONS 

    function submitFeedback(string memory _facultyId, uint8[4] memory _ratings, string memory _comments) external onlyStudent {
        require(teachers[_facultyId].isRegistered, "Teacher ID does not exist");

        uint256 score = 0;
        for(uint i = 0; i < 4; i++) {
            require(_ratings[i] >= 1 && _ratings[i] <= 5, "Ratings must be between 1 and 5");
            score += _ratings[i];
        }

        feedbackIdCounter++;

        feedbacks.push(Feedback({
            id: feedbackIdCounter,
            facultyId: _facultyId,
            ratings: _ratings,
            finalScore: score,
            comments: _comments,
            timestamp: block.timestamp
        }));

        emit FeedbackSubmitted(feedbackIdCounter, _facultyId, score);
    }

    function getAllFeedbacks() external view returns (Feedback[] memory) {
        return feedbacks;
    }

    function isStudent(address _wallet) external view returns (bool) {
        return students[_wallet].isRegistered;
    }
}