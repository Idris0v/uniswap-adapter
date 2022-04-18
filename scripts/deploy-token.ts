import { ethers } from "hardhat";

async function main() {
  const Contract = await ethers.getContractFactory("Token");
  const contract = await Contract.deploy("Air", "AIR");

  await contract.deployed();

  console.log("Token deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
