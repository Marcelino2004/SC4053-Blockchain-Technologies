// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface ILiquidityPool {
    function addLiquidity(uint256 amountA, uint256 amountB) external;

    function swap(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) external returns (uint256 amountOut);

    function getMarketPrice(address tokenIn, address tokenOut)
        external
        view
        returns (uint256 price);

    function getAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) external returns (uint256 amountOut);
}
