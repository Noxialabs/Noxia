// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CaseEscalationRegistry
 * @dev Smart contract for logging case escalations with immutable audit trail
 */
contract CaseEscalationRegistry is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ESCALATOR_ROLE = keccak256("ESCALATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Escalation priority levels
    enum Priority { Normal, High, Critical, Urgent }
    
    // Escalation status
    enum Status { Filed, InProgress, Resolved, Closed }
    
    /**
     * @dev Struct to store escalation information
     */
    struct EscalationRecord {
        bytes32 caseIdHash;           // Hashed case ID for privacy
        address escalatedBy;          // Address of the escalator
        Priority priority;            // Escalation priority level
        Status status;               // Current status
        uint256 escalatedAt;         // Timestamp of escalation
        uint256 lastUpdated;         // Last update timestamp
        string reason;               // Escalation reason
        string jurisdiction;         // Legal jurisdiction
        bool isActive;               // Whether escalation is active
        uint256 blockNumber;         // Block number when filed
    }
    
    /**
     * @dev Struct for AI analysis data
     */
    struct AIAnalysis {
        bool shouldEscalate;         // AI recommendation
        uint256 confidence;          // Confidence score (0-100)
        uint256 urgencyScore;        // Urgency score (0-100)
        string modelVersion;         // AI model version used
    }
    
    // Mappings
    mapping(bytes32 => EscalationRecord) public escalations;
    mapping(bytes32 => AIAnalysis) public aiAnalyses;
    mapping(address => bytes32[]) public userEscalations;
    mapping(Priority => uint256) public escalationCounts;
    
    // Arrays for iteration
    bytes32[] public allEscalations;
    
    // Events
    event EscalationFiled(
        bytes32 indexed caseIdHash,
        address indexed escalatedBy,
        Priority indexed priority,
        uint256 escalatedAt,
        string reason
    );
    
    event EscalationStatusUpdated(
        bytes32 indexed caseIdHash,
        Status oldStatus,
        Status newStatus,
        address updatedBy,
        uint256 timestamp
    );
    
    event AIAnalysisRecorded(
        bytes32 indexed caseIdHash,
        bool shouldEscalate,
        uint256 confidence,
        uint256 urgencyScore,
        string modelVersion
    );
    
    /**
     * @dev Constructor sets up roles and initial state
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ESCALATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev File a new case escalation
     */
    function fileCase(
        bytes32 _caseIdHash,
        Priority _priority,
        string calldata _reason,
        string calldata _jurisdiction
    ) 
        external 
        onlyRole(ESCALATOR_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(_caseIdHash != bytes32(0), "Invalid case ID hash");
        require(!escalations[_caseIdHash].isActive, "Case already escalated");
        require(bytes(_reason).length > 0, "Reason cannot be empty");
        
        // Create escalation record
        escalations[_caseIdHash] = EscalationRecord({
            caseIdHash: _caseIdHash,
            escalatedBy: msg.sender,
            priority: _priority,
            status: Status.Filed,
            escalatedAt: block.timestamp,
            lastUpdated: block.timestamp,
            reason: _reason,
            jurisdiction: _jurisdiction,
            isActive: true,
            blockNumber: block.number
        });
        
        // Update tracking arrays and mappings
        allEscalations.push(_caseIdHash);
        userEscalations[msg.sender].push(_caseIdHash);
        escalationCounts[_priority]++;
        
        emit EscalationFiled(_caseIdHash, msg.sender, _priority, block.timestamp, _reason);
    }
    
    /**
     * @dev Record AI analysis for an escalation
     */
    function recordAIAnalysis(
        bytes32 _caseIdHash,
        bool _shouldEscalate,
        uint256 _confidence,
        uint256 _urgencyScore,
        string calldata _modelVersion
    ) 
        external 
        onlyRole(ESCALATOR_ROLE) 
        whenNotPaused 
    {
        require(escalations[_caseIdHash].isActive, "Escalation not found");
        require(_confidence <= 100, "Invalid confidence score");
        require(_urgencyScore <= 100, "Invalid urgency score");
        
        aiAnalyses[_caseIdHash] = AIAnalysis({
            shouldEscalate: _shouldEscalate,
            confidence: _confidence,
            urgencyScore: _urgencyScore,
            modelVersion: _modelVersion
        });
        
        emit AIAnalysisRecorded(_caseIdHash, _shouldEscalate, _confidence, _urgencyScore, _modelVersion);
    }
    
    /**
     * @dev Update escalation status
     */
    function updateStatus(
        bytes32 _caseIdHash,
        Status _newStatus
    ) 
        external 
        onlyRole(ESCALATOR_ROLE) 
        whenNotPaused 
    {
        require(escalations[_caseIdHash].isActive, "Escalation not found");
        
        Status oldStatus = escalations[_caseIdHash].status;
        escalations[_caseIdHash].status = _newStatus;
        escalations[_caseIdHash].lastUpdated = block.timestamp;
        
        emit EscalationStatusUpdated(_caseIdHash, oldStatus, _newStatus, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get escalation details
     */
    function getEscalation(bytes32 _caseIdHash) 
        external 
        view 
        returns (EscalationRecord memory) 
    {
        return escalations[_caseIdHash];
    }
    
    /**
     * @dev Get AI analysis for a case
     */
    function getAIAnalysis(bytes32 _caseIdHash) 
        external 
        view 
        returns (AIAnalysis memory) 
    {
        return aiAnalyses[_caseIdHash];
    }
    
    /**
     * @dev Verify if a case was escalated
     */
    function verifyEscalation(bytes32 _caseIdHash) 
        external 
        view 
        returns (
            bool isEscalated,
            uint256 escalatedAt,
            address escalatedBy,
            Priority priority
        ) 
    {
        EscalationRecord memory record = escalations[_caseIdHash];
        isEscalated = record.caseIdHash != bytes32(0);
        escalatedAt = record.escalatedAt;
        escalatedBy = record.escalatedBy;
        priority = record.priority;
    }
    
    /**
     * @dev Get escalation statistics
     */
    function getStatistics() 
        external 
        view 
        returns (
            uint256 total,
            uint256[4] memory byPriority,
            uint256 activeCount
        ) 
    {
        total = allEscalations.length;
        
        byPriority[0] = escalationCounts[Priority.Normal];
        byPriority[1] = escalationCounts[Priority.High];
        byPriority[2] = escalationCounts[Priority.Critical];
        byPriority[3] = escalationCounts[Priority.Urgent];
        
        // Count active escalations
        for (uint256 i = 0; i < allEscalations.length; i++) {
            if (escalations[allEscalations[i]].isActive) {
                activeCount++;
            }
        }
    }
    
    /**
     * @dev Get all escalation hashes (paginated)
     */
    function getAllEscalations(uint256 _offset, uint256 _limit) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        require(_offset < allEscalations.length, "Offset too large");
        
        uint256 end = _offset + _limit;
        if (end > allEscalations.length) {
            end = allEscalations.length;
        }
        
        bytes32[] memory result = new bytes32[](end - _offset);
        for (uint256 i = _offset; i < end; i++) {
            result[i - _offset] = allEscalations[i];
        }
        
        return result;
    }
    
    // Admin functions
    function grantEscalatorRole(address _escalator) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _grantRole(ESCALATOR_ROLE, _escalator);
    }
    
    function revokeEscalatorRole(address _escalator) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _revokeRole(ESCALATOR_ROLE, _escalator);
    }
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    function getTotalEscalations() external view returns (uint256) {
        return allEscalations.length;
    }
}