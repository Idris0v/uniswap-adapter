// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Adapter {
    IUniswapV2Factory public immutable factory;
    IUniswapV2Router02 public immutable router;
    mapping(address => mapping(address => address)) public pairs;

    constructor(address factory_, address router_) {
        factory = IUniswapV2Factory(factory_);
        router = IUniswapV2Router02(router_);
    }

    modifier onlyExistingPair(address tokenA, address tokenB) {
        require(
            pairs[tokenA][tokenB] != address(0),
            "Adapter: non-existent pair"
        );
        _;
    }

    function getPairPrice(
        address tokenA,
        address tokenB,
        uint256 amountA
    ) external view onlyExistingPair(tokenA, tokenB) returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
        return router.getAmountsOut(amountA, path)[1];
    }

    function createPair(address tokenA, address tokenB)
        external
        returns (address pair)
    {
        pair = factory.createPair(tokenA, tokenB);
        pairs[tokenA][tokenB] = pair;
        pairs[tokenB][tokenA] = pair;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external onlyExistingPair(tokenA, tokenB) {
        require(
            IERC20(tokenA).transferFrom(
                msg.sender,
                address(this),
                amountADesired
            ),
            "Adapter: tokenA transferFrom failed."
        );
        require(
            IERC20(tokenA).approve(address(router), amountADesired),
            "Adapter: tokenA approve failed."
        );
        require(
            IERC20(tokenB).transferFrom(
                msg.sender,
                address(this),
                amountBDesired
            ),
            "Adapter: tokenB transferFrom failed."
        );
        require(
            IERC20(tokenB).approve(address(router), amountBDesired),
            "Adapter: tokenB approve failed."
        );
        router.addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            msg.sender,
            block.timestamp + 40
        );
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin
    ) external payable {
        require(msg.value > 0, "Send Ether");
        require(
            IERC20(token).transferFrom(
                msg.sender,
                address(this),
                amountTokenDesired
            ),
            "Adapter: token transferFrom failed."
        );
        require(
            IERC20(token).approve(address(router), amountTokenDesired),
            "Adapter: token approve failed."
        );
        router.addLiquidityETH{value: msg.value}(
            token,
            amountTokenDesired,
            amountTokenMin,
            amountETHMin,
            msg.sender,
            block.timestamp + 40
        );
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin
    ) external onlyExistingPair(tokenA, tokenB) {
        require(
            IUniswapV2Pair(pairs[tokenA][tokenB]).transferFrom(
                msg.sender,
                address(this),
                liquidity
            ),
            "Adapter: LP transferFrom failed."
        );
        require(
            IUniswapV2Pair(pairs[tokenA][tokenB]).approve(
                address(router),
                liquidity
            ),
            "Adapter: LP approve failed."
        );
        router.removeLiquidity(
            tokenA,
            tokenB,
            liquidity,
            amountAMin,
            amountBMin,
            msg.sender,
            block.timestamp + 40
        );
    }

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin
    ) external {
        require(
            IUniswapV2Pair(pairs[token][router.WETH()]).transferFrom(
                msg.sender,
                address(this),
                liquidity
            ),
            "Adapter: LP transferFrom failed."
        );
        require(
            IUniswapV2Pair(pairs[token][router.WETH()]).approve(
                address(router),
                liquidity
            ),
            "Adapter: LP approve failed."
        );
        router.removeLiquidityETH(
            token,
            liquidity,
            amountTokenMin,
            amountETHMin,
            msg.sender,
            block.timestamp + 40
        );
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) external onlyExistingPair(tokenIn, tokenOut) {
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "Adapter: tokenIn transferFrom failed."
        );
        require(
            IERC20(tokenIn).approve(address(router), amountIn),
            "Adapter: tokenIn approve failed."
        );
        // amountOutMin must be retrieved from an oracle of some kind
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );
    }

    function swapByPath(
        address[] calldata tokens,
        uint256 amountIn,
        uint256 amountOutMin
    ) external {
        require(
            IERC20(tokens[0]).transferFrom(msg.sender, address(this), amountIn),
            "Adapter: tokenIn transferFrom failed."
        );
        require(
            IERC20(tokens[0]).approve(address(router), amountIn),
            "Adapter: tokenIn approve failed."
        );
        // amountOutMin must be retrieved from an oracle of some kind
        router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            tokens,
            msg.sender,
            block.timestamp
        );
    }
}
