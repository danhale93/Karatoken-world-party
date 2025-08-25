const hre = require("hardhat");

async function main() {
  // Deploy the KaratokenNFT contract
  const KaratokenNFT = await hre.ethers.getContractFactory("KaratokenNFT");
  const karatokenNFT = await KaratokenNFT.deploy();
  
  await karatokenNFT.deployed();
  
  console.log("KaratokenNFT deployed to:", karatokenNFT.address);
  
  return karatokenNFT;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
