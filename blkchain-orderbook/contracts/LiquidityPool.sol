// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@prb/math/src/Common.sol" as PRBMath;
import "hardhat/console.sol";
import "./interfaces/ILiquidityPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityPool is ILiquidityPool {
    IERC20 public tokenA;
    IERC20 public tokenB;

    uint256 public totalSupplyA;
    uint256 public totalSupplyB;

    uint256 public constant SCALE = 1e18;

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    // Adds liquidity
    function addLiquidity(uint256 amountA, uint256 amountB) external override {
        require(amountA > 0 && amountB > 0, "Amount must be greater than 0");

        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        totalSupplyA += amountA;
        totalSupplyB += amountB;
    }

    // Swaps tokens
    function swap(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) external override returns (uint256 amountOut) {
        require(
            tokenIn == address(tokenA) || tokenIn == address(tokenB),
            "Invalid tokenIn"
        );
        require(
            tokenOut == address(tokenA) || tokenOut == address(tokenB),
            "Invalid tokenOut"
        );
        require(tokenIn != tokenOut, "Tokens must be different");

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        amountOut = getAmountOut(amountIn, tokenIn, tokenOut);

        if (tokenIn == address(tokenA)) {
            uint256 numerator = amountIn * totalSupplyB;
            uint256 denominator = totalSupplyA + amountIn;

            amountOut = numerator / denominator;

            require(amountOut <= totalSupplyB, "not enough liquidity");
            totalSupplyA += amountIn;
            totalSupplyB -= amountOut;
        } else if (tokenIn == address(tokenB)) {
            uint256 numerator = amountIn * totalSupplyA;
            uint256 denominator = totalSupplyB + amountIn;

            amountOut = numerator / denominator;

            require(amountOut <= totalSupplyA, "not enough liquidity");
            totalSupplyB += amountIn;
            totalSupplyA -= amountOut;
        }

        IERC20(tokenOut).transfer(msg.sender, amountOut);

        return amountOut;
    }

    function getMarketPrice(
        address tokenIn,
        address tokenOut
    ) public view override returns (uint256 price) {
        if (tokenIn == address(tokenA)) {
            return priceOfBinA();
        } else if (tokenIn == address(tokenB)) {
            return priceOfAinB();
        }

        revert("Invalid token pair");
    }

    // Price of Token A in terms of Token B
    function priceOfAinB() internal view returns (uint256 price) {
        uint256 numerator = 1e18 * totalSupplyA;
        uint256 denominator = totalSupplyB + 1e18;

        uint256 amountOut = numerator / denominator;
        return amountOut;
    }

    // Price of Token B in terms of Token A
    function priceOfBinA() internal view returns (uint256 price) {
        uint256 numerator = 1e18 * totalSupplyB;
        uint256 denominator = totalSupplyA + 1e18;

        uint256 amountOut = numerator / denominator;

        return amountOut;
    }

    function getAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) public view override returns (uint256) {
        require(
            tokenIn == address(tokenA) || tokenIn == address(tokenB),
            "Invalid tokenIn"
        );
        require(
            tokenOut == address(tokenA) || tokenOut == address(tokenB),
            "Invalid tokenOut"
        );
        require(tokenIn != tokenOut, "Tokens must be different");
        require(amountIn > 0, "Amount must be greater than 0");
        uint256 supplyIn = tokenIn == address(tokenA)
            ? totalSupplyA
            : totalSupplyB;
        uint256 supplyOut = tokenOut == address(tokenB)
            ? totalSupplyB
            : totalSupplyA;

        uint256 supplyAfter = PRBMath.mulDiv(
            supplyIn,
            supplyOut,
            supplyIn + amountIn
        );
        require(supplyAfter > 0, "Not enough liquidity");

        return supplyOut - supplyAfter;
    }
}
