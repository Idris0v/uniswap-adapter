import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";


describe('Adapter', () => {
    let owner: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress;

    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners();
        const AirFactory = await ethers.getContractFactory("Adapter");
    });

});