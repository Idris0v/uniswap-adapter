import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Adapter, IUniswapV2Router02, Token } from "../typechain";

describe("Adapter", () => {
  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress;
  let tokenA: Token, tokenB: Token, tokenC: Token;
  let adapter: Adapter;
  let weth: string;
  let snapshot: any;

  before(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("Token");
    tokenA = await Contract.deploy("TokenA", "A");
    tokenB = await Contract.deploy("TokenB", "B");
    tokenC = await Contract.deploy("TokenC", "C");
    await tokenA.deployed();
    await tokenB.deployed();
    await tokenC.deployed();
    await tokenA.mint(parseEther(2000), owner.address);
    await tokenB.mint(parseEther(3000), owner.address);
    await tokenC.mint(parseEther(2000), owner.address);

    if (!process.env.FACTORY_ADDRESS || !process.env.ROUTER_ADDRESS) {
      throw new Error("Factory or Router addresses not provided");
    }
    const AdapterFactory = await ethers.getContractFactory("Adapter");
    adapter = await AdapterFactory.deploy(
      process.env.FACTORY_ADDRESS,
      process.env.ROUTER_ADDRESS
    );
    await adapter.deployed();
    const router: IUniswapV2Router02 = await ethers.getContractAt(
      "IUniswapV2Router02",
      await adapter.router()
    );
    weth = await router.WETH();
    await adapter.createPair(tokenA.address, tokenB.address);
    await adapter.createPair(tokenB.address, tokenC.address);
    await adapter.createPair(weth, tokenC.address);

    await tokenA.approve(adapter.address, parseEther(2000));
    await tokenB.approve(adapter.address, parseEther(3000));
    await tokenC.approve(adapter.address, parseEther(2000));

    snapshot = await network.provider.request({
      method: "evm_snapshot",
      params: [],
    });
  });

  afterEach(async function () {
    await network.provider.request({
      method: "evm_revert",
      params: [snapshot],
    });

    snapshot = await network.provider.request({
      method: "evm_snapshot",
      params: [],
    });
  });

  function parseEther(amount: number) {
    return ethers.utils.parseEther(amount.toString());
  }

  it("should create pairs", async () => {
    expect(await adapter.pairs(tokenA.address, tokenB.address)).be
      .properAddress;
    expect(await adapter.pairs(tokenB.address, tokenC.address)).be
      .properAddress;
    expect(await adapter.pairs(weth, tokenC.address)).be.properAddress;
  });

  it("should add liquidity with tokens", async () => {
    const thousand = parseEther(1000);
    const fiveHundred = parseEther(500);

    await adapter.addLiquidity(
      tokenA.address,
      tokenB.address,
      thousand,
      thousand,
      0,
      0
    );
    await adapter.addLiquidity(
      tokenB.address,
      tokenC.address,
      thousand,
      fiveHundred,
      0,
      0
    );
    const pair1Addr = await adapter.pairs(tokenA.address, tokenB.address);
    const pair2Addr = await adapter.pairs(tokenB.address, tokenC.address);
    const pair1 = await ethers.getContractAt("IUniswapV2Pair", pair1Addr);
    const pair1Reserves = await pair1.getReserves();
    const pair2 = await ethers.getContractAt("IUniswapV2Pair", pair2Addr);
    const pair2Reserves = await pair2.getReserves();
    expect(pair1Reserves.reserve0).be.equal(thousand);
    expect(pair1Reserves.reserve1).be.equal(thousand);
    expect(pair2Reserves.reserve0).be.equal(fiveHundred);
    expect(pair2Reserves.reserve1).be.equal(thousand);
  });

  it("should add liquidity with token and WETH", async () => {
    const fiveHundred = parseEther(500);
    await adapter.addLiquidityETH(tokenC.address, fiveHundred, 0, 0, {
      value: parseEther(1),
    });
    const pair1Addr = await adapter.pairs(tokenC.address, weth);
    const pair1 = await ethers.getContractAt("IUniswapV2Pair", pair1Addr);
    const pair1Reserves = await pair1.getReserves();
    expect(pair1Reserves.reserve0).be.equal(fiveHundred);
    expect(pair1Reserves.reserve1).be.equal(parseEther(1));
  });

  it("should remove liquidity of tokens", async () => {
    const thousand = parseEther(1000);
    await adapter.addLiquidity(
      tokenA.address,
      tokenB.address,
      thousand,
      thousand,
      0,
      0
    );
    const pairAddr = await adapter.pairs(tokenA.address, tokenB.address);
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddr);
    const lpBalance = await pair.balanceOf(owner.address);
    await pair.approve(adapter.address, lpBalance);

    await adapter.removeLiquidity(
      tokenA.address,
      tokenB.address,
      lpBalance.div(2),
      parseEther(400),
      parseEther(400)
    );

    expect(await pair.balanceOf(owner.address)).be.equal(lpBalance.div(2));
  });

  it("should remove liquidity of token and WETH", async () => {
    const fiveHundred = parseEther(500);
    await adapter.addLiquidityETH(tokenC.address, fiveHundred, 0, 0, {
      value: parseEther(1),
    });
    const pairAddr = await adapter.pairs(tokenC.address, weth);
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddr);
    const lpBalance = await pair.balanceOf(owner.address);
    await pair.approve(adapter.address, lpBalance);

    await adapter.removeLiquidityETH(
      tokenC.address,
      lpBalance.div(2),
      parseEther(200),
      parseEther(0.4)
    );

    expect(await pair.balanceOf(owner.address)).be.equal(lpBalance.div(2));
  });

  it("should swap tokenA for tokenB", async () => {
    const thousand = parseEther(1000);
    await adapter.addLiquidity(
      tokenA.address,
      tokenB.address,
      thousand,
      thousand,
      0,
      0
    );
    const balanceBefore = await tokenA.balanceOf(owner.address);
    await adapter.swap(
      tokenA.address,
      tokenB.address,
      parseEther(100),
      parseEther(90)
    );
    expect(await tokenA.balanceOf(owner.address)).be.equal(balanceBefore.sub(parseEther(100)));
  });

  it("should swap tokenA for tokenC", async () => {
    const thousand = parseEther(1000);
    const fiveHundred = parseEther(500);
    await adapter.addLiquidity(
      tokenA.address,
      tokenB.address,
      thousand,
      thousand,
      0,
      0
    );
    await adapter.addLiquidity(
      tokenB.address,
      tokenC.address,
      thousand,
      fiveHundred,
      0,
      0
    );
    const balanceBefore = await tokenA.balanceOf(owner.address);
    await adapter.swapByPath(
      [tokenA.address, tokenB.address, tokenC.address],
      parseEther(100),
      parseEther(40)
    );
    expect(await tokenA.balanceOf(owner.address)).be.equal(balanceBefore.sub(parseEther(100)));
  });
});
