import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

task('createpair', 'claim pending rewards')
    .addParam('tokena', 'token address')
    .addParam('tokenb', 'token address')
    .setAction(async ({ tokena, tokenb }, { ethers }) => {
        if (!process.env.ADAPTER_ADDRESS) {
            throw new Error('ADAPTER_ADDRESS is not provided');
        }

        const adapter = await ethers.getContractAt(
            "Adapter",
            process.env.ADAPTER_ADDRESS
        );

        const tx = await adapter.createPair(tokena, tokenb);
        await tx.wait();
    });