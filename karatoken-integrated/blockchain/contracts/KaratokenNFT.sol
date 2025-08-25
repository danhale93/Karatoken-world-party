// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract KaratokenNFT is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Struct to store performance data
    struct PerformanceData {
        uint256 score;
        string lyrics;
        string emotion;
        address originalPerformer;
        uint256 timestamp;
        uint256 royaltyBasisPoints; // 100 = 1%
    }

    // Mapping from token ID to performance data
    mapping(uint256 => PerformanceData) public performanceData;

    // Event emitted when a new remix is created
    event RemixMinted(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 score,
        string emotion,
        uint256 timestamp
    );

    constructor() ERC1155("https://api.karatoken.world/api/token/{id}") {}

    /**
     * @dev Mints a new performance NFT with the given score and metadata
     * @param score The performance score (0-100)
     * @param lyrics The lyrics of the performance
     * @param emotion Detected emotion from the performance
     * @param royaltyBasisPoints Royalty percentage in basis points (100 = 1%)
     * @param amount Number of tokens to mint
     */
    function mintPerformance(
        uint256 score,
        string memory lyrics,
        string memory emotion,
        uint256 royaltyBasisPoints,
        uint256 amount
    ) public returns (uint256) {
        require(score <= 100, "Score must be <= 100");
        require(royaltyBasisPoints <= 1000, "Royalty too high (max 10%)");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Store performance data
        performanceData[newTokenId] = PerformanceData({
            score: score,
            lyrics: lyrics,
            emotion: emotion,
            originalPerformer: msg.sender,
            timestamp: block.timestamp,
            royaltyBasisPoints: royaltyBasisPoints
        });

        // Mint the tokens
        _mint(msg.sender, newTokenId, amount, "");
        
        emit RemixMinted(
            newTokenId,
            msg.sender,
            score,
            emotion,
            block.timestamp
        );

        return newTokenId;
    }

    /**
     * @dev Calculates royalties based on the performance score
     */
    function calculateRoyalty(uint256 tokenId, uint256 salePrice) 
        public 
        view 
        returns (address receiver, uint256 royaltyAmount) 
    {
        PerformanceData memory data = performanceData[tokenId];
        uint256 royalty = (salePrice * data.royaltyBasisPoints) / 10000;
        return (data.originalPerformer, royalty);
    }

    /**
     * @dev Returns the URI for a given token ID
     */
    function uri(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        require(tokenId <= _tokenIds.current(), "Token does not exist");
        return string(
            abi.encodePacked(
                super.uri(tokenId),
                Strings.toString(tokenId)
            )
        );
    }
}
