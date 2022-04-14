// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

contract Adapter {
    address public factory;
    constructor(address factory_) {
        factory = factory_;
    }

    function pairInfo(address tokenA, address tokenB) external view {
        IUniswapV2Pair pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, tokenA, tokenB));
        totalSupply = pair.totalSupply();
    }
}
