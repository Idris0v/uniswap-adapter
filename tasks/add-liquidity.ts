import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

task('addliquidity', 'claim pending rewards')
    .addParam('tokena', 'token address')
    .addParam('tokenb', 'token address')
    .addParam('amountadesired', 'amount a')
    .addParam('amountbdesired', 'amount b')
    .addParam('amountamin', 'amount a min')
    .addParam('amountbmi', 'amount b')
    .setAction(async ({ tokena, tokenb, amountadesired, amountbdesired, amountamin, amountbmin }, { ethers }) => {
        if (!process.env.ADAPTER_ADDRESS) {
            throw new Error('ADAPTER_ADDRESS is not provided');
        }

        const adapter = await ethers.getContractAt(
            "Adapter",
            process.env.ADAPTER_ADDRESS
        );

        const tokenA = await ethers.getContractAt("Token", tokena);
        const tokenB = await ethers.getContractAt("Token", tokenb);
        await tokenA.approve(adapter.address, amountadesired);
        await tokenB.approve(adapter.address, amountbdesired);

        const tx = await adapter.addLiquidity(tokena, tokenb, amountadesired, amountbdesired, amountamin, amountbmin);
        await tx.wait();
    });
