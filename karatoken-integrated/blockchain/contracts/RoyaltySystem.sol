// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./KRTToken.sol";

/**
 * @title Karatoken Royalty System
 * @dev Handles music royalties and payments to rights holders
 */
contract RoyaltySystem is Ownable {
    KRTToken public krtToken;
    
    // Track registration
    struct Track {
        string title;
        string artist;
        string composer;
        string publisher;
        address rightsHolder;
        uint256 totalPlays;
        uint256 totalEarnings;
        bool isRegistered;
    }
    
    // Performance data
    struct Performance {
        address performer;
        string trackId;
        uint256 duration;
        uint256 audienceSize;
        uint256 timestamp;
        uint256 royaltyPaid;
    }
    
    mapping(string => Track) public tracks;
    mapping(address => uint256) public rightsHolderBalances;
    mapping(address => Performance[]) public performances;
    
    // Royalty rates (in basis points - 100 = 1%)
    uint256 public constant STREAMING_RATE = 10; // 0.1% per play
    uint256 public constant DOWNLOAD_RATE = 5000; // 50% fixed
    uint256 public constant LIVE_RATE = 50; // 0.5% per minute
    uint256 public constant COVER_SPLIT_RIGHTS_HOLDER = 70; // 70% to rights holder
    uint256 public constant COVER_SPLIT_PERFORMER = 30; // 30% to performer
    
    // Events
    event TrackRegistered(string trackId, string title, string artist, address rightsHolder);
    event RoyaltyPaid(string trackId, address rightsHolder, uint256 amount, string reason);
    event PerformanceRecorded(address performer, string trackId, uint256 duration, uint256 royalty);
    
    constructor(address _krtToken) {
        krtToken = KRTToken(_krtToken);
    }
    
    /**
     * @dev Register a new track
     */
    function registerTrack(
        string memory trackId,
        string memory title,
        string memory artist,
        string memory composer,
        string memory publisher,
        address rightsHolder
    ) external onlyOwner {
        require(rightsHolder != address(0), "Invalid rights holder address");
        require(!tracks[trackId].isRegistered, "Track already registered");
        
        tracks[trackId] = Track({
            title: title,
            artist: artist,
            composer: composer,
            publisher: publisher,
            rightsHolder: rightsHolder,
            totalPlays: 0,
            totalEarnings: 0,
            isRegistered: true
        });
        
        emit TrackRegistered(trackId, title, artist, rightsHolder);
    }
    
    /**
     * @dev Record a streaming play
     */
    function recordStreamingPlay(string memory trackId, address listener) external onlyOwner {
        require(tracks[trackId].isRegistered, "Track not registered");
        
        Track storage track = tracks[trackId];
        track.totalPlays += 1;
        
        // Calculate royalty (0.1% of base reward)
        uint256 royalty = (5 * 10**18 * STREAMING_RATE) / 10000; // 5 KRT * 0.1%
        
        track.totalEarnings += royalty;
        rightsHolderBalances[track.rightsHolder] += royalty;
        
        emit RoyaltyPaid(trackId, track.rightsHolder, royalty, "Streaming Play");
    }
    
    /**
     * @dev Record a download
     */
    function recordDownload(string memory trackId, address buyer) external onlyOwner {
        require(tracks[trackId].isRegistered, "Track not registered");
        
        Track storage track = tracks[trackId];
        
        // Fixed royalty for download (50% of base reward)
        uint256 royalty = (5 * 10**18 * DOWNLOAD_RATE) / 10000; // 5 KRT * 50%
        
        track.totalEarnings += royalty;
        rightsHolderBalances[track.rightsHolder] += royalty;
        
        emit RoyaltyPaid(trackId, track.rightsHolder, royalty, "Download");
    }
    
    /**
     * @dev Record a live performance
     */
    function recordLivePerformance(
        string memory trackId,
        address performer,
        uint256 durationMinutes,
        uint256 audienceSize
    ) external onlyOwner {
        require(tracks[trackId].isRegistered, "Track not registered");
        
        Track storage track = tracks[trackId];
        
        // Calculate royalty based on duration and audience
        uint256 baseRoyalty = (5 * 10**18 * LIVE_RATE * durationMinutes) / 10000; // 5 KRT * 0.5% * minutes
        uint256 audienceBonus = (baseRoyalty * audienceSize) / 1000; // Bonus based on audience size
        uint256 totalRoyalty = baseRoyalty + audienceBonus;
        
        // Split between rights holder and performer for covers
        uint256 rightsHolderShare = (totalRoyalty * COVER_SPLIT_RIGHTS_HOLDER) / 100;
        uint256 performerShare = (totalRoyalty * COVER_SPLIT_PERFORMER) / 100;
        
        track.totalEarnings += rightsHolderShare;
        rightsHolderBalances[track.rightsHolder] += rightsHolderShare;
        
        // Record performance
        performances[performer].push(Performance({
            performer: performer,
            trackId: trackId,
            duration: durationMinutes,
            audienceSize: audienceSize,
            timestamp: block.timestamp,
            royaltyPaid: performerShare
        }));
        
        // Award performer their share
        krtToken.earnReward(performer, performerShare, "Live Performance");
        
        emit PerformanceRecorded(performer, trackId, durationMinutes, performerShare);
        emit RoyaltyPaid(trackId, track.rightsHolder, rightsHolderShare, "Live Performance");
    }
    
    /**
     * @dev Withdraw accumulated royalties
     */
    function withdrawRoyalties() external {
        uint256 balance = rightsHolderBalances[msg.sender];
        require(balance > 0, "No royalties to withdraw");
        
        rightsHolderBalances[msg.sender] = 0;
        krtToken.earnReward(msg.sender, balance, "Royalty Withdrawal");
    }
    
    /**
     * @dev Get track information
     */
    function getTrackInfo(string memory trackId) external view returns (
        string memory title,
        string memory artist,
        address rightsHolder,
        uint256 totalPlays,
        uint256 totalEarnings
    ) {
        Track memory track = tracks[trackId];
        return (
            track.title,
            track.artist,
            track.rightsHolder,
            track.totalPlays,
            track.totalEarnings
        );
    }
    
    /**
     * @dev Get rights holder balance
     */
    function getRightsHolderBalance(address rightsHolder) external view returns (uint256) {
        return rightsHolderBalances[rightsHolder];
    }
    
    /**
     * @dev Get performer's performance history
     */
    function getPerformanceHistory(address performer) external view returns (Performance[] memory) {
        return performances[performer];
    }
} 