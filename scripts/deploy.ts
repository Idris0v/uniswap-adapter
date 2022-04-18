import { ethers } from "hardhat";

async function main() {
  if (!process.env.FACTORY_ADDRESS || !process.env.ROUTER_ADDRESS) {
    throw new Error("Factory or Router addresses not provided");
  }
  const Contract = await ethers.getContractFactory("Adapter");
  const contract = await Contract.deploy(
    process.env.FACTORY_ADDRESS,
    process.env.ROUTER_ADDRESS
  );

  await contract.deployed();

  console.log("Adapter deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
