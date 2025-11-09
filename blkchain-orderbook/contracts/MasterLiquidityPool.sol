// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./interfaces/IMasterLiquidityPool.sol";
import "./LiquidityPool.sol";

contract MasterLiquidityPool is IMasterLiquidityPool {
    // Array to store AMM contract addresses
    mapping(bytes32 => address) public tokenPairLPs;

    function registerTokenPair(
        address tokenPair0,
        address tokenPair1
    ) external {
        require(
            tokenPair0 != address(0) && tokenPair1 != address(0),
            "Invalid token addresses"
        );

        // Sort addresses
        address tokenA = tokenPair0 < tokenPair1 ? tokenPair0 : tokenPair1;
        address tokenB = tokenPair0 < tokenPair1 ? tokenPair1 : tokenPair0;

        bytes32 tokenPairHash = keccak256(abi.encodePacked(tokenA, tokenB));

        address lp_addr = address(new LiquidityPool(tokenA, tokenB));
        tokenPairLPs[tokenPairHash] = lp_addr;

        emit LPAdded(address(lp_addr));
    }

    function getLP(
        address tokenPair0,
        address tokenPair1
    ) external view returns (ILiquidityPool) {
        require(
            tokenPair0 != address(0) && tokenPair1 != address(0),
            "Invalid token addresses"
        );

        // Ensure consistent ordering of tokens
        address tokenA = tokenPair0 < tokenPair1 ? tokenPair0 : tokenPair1;
        address tokenB = tokenPair0 < tokenPair1 ? tokenPair1 : tokenPair0;
        bytes32 tokenPairHash = keccak256(abi.encodePacked(tokenA, tokenB));

        address LP_addr = tokenPairLPs[tokenPairHash];
        require(
            LP_addr != address(0),
            "LP is not found for the particular token pair"
        );

        return ILiquidityPool(LP_addr);
    }
}
