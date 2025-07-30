// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, externalEuint64, euint64, eaddress, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { Ownable2Step, Ownable } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ClimateProtectionPHE is SepoliaConfig, Ownable2Step, ReentrancyGuard {
    
    // Climate project structure - optimized based on demo patterns
    struct ClimateProject {
        uint256 id;
        string title;
        string description;
        address beneficiary;
        uint256 targetAmount;        // Public target for transparency
        uint256 auctionStartTime;    // Following demo naming convention
        uint256 auctionEndTime;      // Following demo naming convention
        bool isActive;
        bool isCompleted;
        bool fundsWithdrawn;
        
        // Data fields
        uint256 totalDonationsEncrypted;
        uint256 donorCount;          // Public count
        uint256 totalDonationsPublic; // Public total for progress display
    }

    // State variables - following demo patterns
    mapping(uint256 => ClimateProject) public projects;
    mapping(uint256 => mapping(address => euint64)) private donations;
    
    // User participation tracking
    mapping(address => uint256[]) private userCreatedProjects;  // Projects created by user
    mapping(address => uint256[]) private userDonatedProjects;  // Projects user donated to
    mapping(uint256 => address[]) private projectDonors;       // Donors for each project

    uint256 public projectCounter;
    
    // Allow contract to receive ETH
    receive() external payable {}

    // Events - following demo patterns
    event ProjectCreated(uint256 indexed projectId, address indexed beneficiary, string title);
    event DonationMade(uint256 indexed projectId, address indexed donor);
    event FundsWithdrawn(uint256 indexed projectId, address beneficiary, uint256 amount);

    // Errors - following demo patterns
    error TooEarlyError(uint256 time);
    error TooLateError(uint256 time);
    error InsufficientFunds();

    // Modifiers - following demo patterns
    modifier onlyDuringProject(uint256 projectId) {
        ClimateProject storage project = projects[projectId];
        if (block.timestamp < project.auctionStartTime) revert TooEarlyError(project.auctionStartTime);
        if (block.timestamp >= project.auctionEndTime) revert TooLateError(project.auctionEndTime);
        if (!project.isActive) revert TooLateError(project.auctionEndTime);
        _;
    }

    modifier onlyAfterProjectEnd(uint256 projectId) {
        ClimateProject storage project = projects[projectId];
        if (block.timestamp < project.auctionEndTime) revert TooEarlyError(project.auctionEndTime);
        _;
    }


    constructor() Ownable(msg.sender) {
        // ETH version doesn't need token contract
    }

    // View functions - following demo patterns
    function getEncryptedDonation(uint256 projectId, address account) external view returns (euint64) {
        return donations[projectId][account];
    }


    // Create a climate project - improved based on demo patterns
    function createProject(
        string memory title,
        string memory description,
        uint256 targetAmount,
        uint256 duration
    ) external returns (uint256 projectId) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(targetAmount > 0, "Target amount must be positive");
        require(duration > 0, "Duration must be positive");

        projectId = ++projectCounter;
        
        ClimateProject storage project = projects[projectId];
        project.id = projectId;
        project.title = title;
        project.description = description;
        project.beneficiary = msg.sender;
        project.targetAmount = targetAmount;
        project.auctionStartTime = block.timestamp;
        project.auctionEndTime = block.timestamp + duration;
        project.isActive = true;
        project.isCompleted = false;
        project.fundsWithdrawn = false;
        project.donorCount = 0;
        project.totalDonationsPublic = 0;
        
        // Initialize total donations field
        project.totalDonationsEncrypted = 0;
        
        // Record that this user created this project
        userCreatedProjects[msg.sender].push(projectId);

        emit ProjectCreated(projectId, msg.sender, title);
    }

    // Make an encrypted donation - ETH version
    function donate(
        uint256 projectId,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external payable onlyDuringProject(projectId) nonReentrant {
        ClimateProject storage project = projects[projectId];
        
        if (msg.value == 0) revert InsufficientFunds();
        
        // Get and verify the amount from the user
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        // Convert msg.value to euint64 for FHE operations
        euint64 actualAmount = FHE.asEuint64(uint64(msg.value));

        // Update donation balance - exactly like demo bid logic
        euint64 previousDonation = donations[projectId][msg.sender];
        bool isFirstTimeDonor = !FHE.isInitialized(previousDonation);
        
        if (isFirstTimeDonor) {
            // First donation for the user
            donations[projectId][msg.sender] = actualAmount;
            project.donorCount++; // Only increment for first-time donors
            
            // Record user participation
            userDonatedProjects[msg.sender].push(projectId);
            projectDonors[projectId].push(msg.sender);
        } else {
            // The user increases their donation
            euint64 newDonation = FHE.add(previousDonation, actualAmount);
            donations[projectId][msg.sender] = newDonation;
        }

        // Update public total donations
        project.totalDonationsPublic += msg.value;


        // Update project totals
        project.totalDonationsEncrypted += msg.value;

        emit DonationMade(projectId, msg.sender);
    }


    // Project beneficiary withdraws remaining funds (can be called when target reached or time expired)
    function withdrawProjectFunds(uint256 projectId) external nonReentrant {
        ClimateProject storage project = projects[projectId];
        require(msg.sender == project.beneficiary, "Only beneficiary can withdraw");
        require(!project.fundsWithdrawn, "Funds already withdrawn");
        
        // Can withdraw if: 1) time expired OR 2) target amount reached
        bool timeExpired = block.timestamp >= project.auctionEndTime;
        bool targetReached = address(this).balance >= project.targetAmount;
        
        require(timeExpired || targetReached, "Cannot withdraw: time not expired and target not reached");

        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds to withdraw");

        project.fundsWithdrawn = true;
        project.isActive = false;
        project.isCompleted = true;

        // Transfer all ETH to beneficiary
        (bool success, ) = payable(project.beneficiary).call{value: contractBalance}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(projectId, project.beneficiary, contractBalance);
    }

    // Get project info (public data only)
    function getProject(uint256 projectId) external view returns (
        string memory title,
        string memory description,
        address beneficiary,
        uint256 targetAmount,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        uint256 donorCount,
        uint256 totalDonationsPublic
    ) {
        ClimateProject storage project = projects[projectId];
        return (
            project.title,
            project.description,
            project.beneficiary,
            project.targetAmount,
            project.auctionStartTime,
            project.auctionEndTime,
            project.isActive,
            project.donorCount,
            project.totalDonationsPublic
        );
    }

    // Get all projects list
    function getAllProjects() external view returns (uint256[] memory) {
        uint256[] memory projectIds = new uint256[](projectCounter);
        for (uint256 i = 1; i <= projectCounter; i++) {
            projectIds[i-1] = i;
        }
        return projectIds;
    }

    // Get active projects count
    function getActiveProjectsCount() external view returns (uint256 count) {
        for (uint256 i = 1; i <= projectCounter; i++) {
            if (projects[i].isActive && block.timestamp < projects[i].auctionEndTime) {
                count++;
            }
        }
    }

    // Get active projects list
    function getActiveProjects() external view returns (uint256[] memory) {
        uint256 activeCount = this.getActiveProjectsCount();
        uint256[] memory activeProjectIds = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= projectCounter; i++) {
            if (projects[i].isActive && block.timestamp < projects[i].auctionEndTime) {
                activeProjectIds[index] = i;
                index++;
            }
        }
        return activeProjectIds;
    }

    // Get project progress (current total donations vs target)
    function getProjectProgress(uint256 projectId) external view returns (uint256 currentAmount, uint256 targetAmount, uint256 donorCount) {
        ClimateProject storage project = projects[projectId];
        return (project.totalDonationsPublic, project.targetAmount, project.donorCount);
    }

    // Get project's total donations (both public and encrypted totals should be the same now)
    function getProjectTotalDonations(uint256 projectId) external view returns (uint256 totalDonations, uint256 publicTotal) {
        ClimateProject storage project = projects[projectId];
        return (project.totalDonationsEncrypted, project.totalDonationsPublic);
    }

    // Get projects created by user
    function getUserCreatedProjects(address user) external view returns (uint256[] memory) {
        return userCreatedProjects[user];
    }

    // Get projects user donated to
    function getUserDonatedProjects(address user) external view returns (uint256[] memory) {
        return userDonatedProjects[user];
    }

    // Get user's total donation amount for a specific project (for project creator or donor themselves)
    function getUserDonationAmount(uint256 projectId, address user) external view returns (uint256) {
        ClimateProject storage project = projects[projectId];
        
        // Only project creator or the donor themselves can query
        require(
            msg.sender == project.beneficiary || msg.sender == user,
            "Only project creator or donor can query donation amount"
        );
        
        // This returns 0 for privacy if queried by others
        // In real implementation, we could decrypt the FHE amount for authorized users
        return 0; // Placeholder - would need FHE decryption for actual amount
    }

    // Check if user has donated to a project (public info)
    function hasUserDonated(uint256 projectId, address user) external view returns (bool) {
        return FHE.isInitialized(donations[projectId][user]);
    }

    // Get donors list for a project (only for project creator)
    function getProjectDonors(uint256 projectId) external view returns (address[] memory) {
        ClimateProject storage project = projects[projectId];
        require(msg.sender == project.beneficiary, "Only project creator can view donors list");
        return projectDonors[projectId];
    }

    // Emergency functions - following demo patterns
    function emergencyPause(uint256 projectId) external onlyOwner {
        projects[projectId].isActive = false;
    }

    function resumeProject(uint256 projectId) external onlyOwner {
        require(block.timestamp < projects[projectId].auctionEndTime, "Project deadline passed");
        projects[projectId].isActive = true;
    }

    // Get platform statistics
    function getPlatformStats() external view returns (
        uint256 totalProjects,
        uint256 activeProjects,
        uint256 completedProjects,
        uint256 totalDonationsAmount,
        uint256 totalDonors
    ) {
        uint256 activeProjCount = 0;
        uint256 completedProjCount = 0;
        uint256 totalAmount = 0;
        uint256 totalDonorsCount = 0;
        
        for (uint256 i = 1; i <= projectCounter; i++) {
            ClimateProject storage project = projects[i];
            
            // Count active projects
            if (project.isActive && block.timestamp < project.auctionEndTime) {
                activeProjCount++;
            }
            
            // Count completed projects
            if (project.isCompleted || project.fundsWithdrawn) {
                completedProjCount++;
            }
            
            // Sum up total donations
            totalAmount += project.totalDonationsPublic;
            
            // Sum up total donors
            totalDonorsCount += project.donorCount;
        }
        
        return (
            projectCounter,
            activeProjCount,
            completedProjCount,
            totalAmount,
            totalDonorsCount
        );
    }
}