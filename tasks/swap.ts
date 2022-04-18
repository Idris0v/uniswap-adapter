import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

task('swap', 'swap tokens')
    .addParam('tokenin', 'token address')
    .addParam('tokenout', 'token address')
    .addParam('amountin', 'amount a')
    .addParam('amountoutmin', 'amount b')
    .setAction(async ({ tokenin, tokenout, amountin, amountoutmin }, { ethers }) => {
        if (!process.env.ADAPTER_ADDRESS) {
            throw new Error('ADAPTER_ADDRESS is not provided');
        }

        const adapter = await ethers.getContractAt(
            "Adapter",
            process.env.ADAPTER_ADDRESS
        );

        const tokenA = await ethers.getContractAt("Token", tokenin);
        await tokenA.approve(adapter.address, amountin);

        const tx = await adapter.swap(tokenin, tokenout, amountin, amountoutmin);
        await tx.wait();
    });
