const hre = require("hardhat");

async function main() {
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  const MetadataRegistry = await hre.ethers.getContractFactory("MDRTFull");
  const registry = await MetadataRegistry.deploy("PIR 1", "PIR1");

  await registry.deployed();

  console.log("MDRTFull deployed to:", registry.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
