// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./ILiquidityPool.sol";

interface IMasterLiquidityPool {
    // Event to log addition of a new Liquidity Pool address
    event LPAdded(address indexed LPAddress);

    // Function to register a token pair and its associated LP address
    function registerTokenPair(
        address tokenPair0,
        address tokenPair1
    ) external;

    // Function to retrieve the LP address for a given token pair hash
    function tokenPairLPs(bytes32 tokenPairHash) external view returns (address);
    function getLP(address tokenPair0, address tokenPair1) external view returns (ILiquidityPool);
}