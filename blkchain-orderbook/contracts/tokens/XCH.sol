//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract XCH is ERC20 {

    constructor(uint256 initialSupply) ERC20("Chia", "XCH"){
        _mint(msg.sender, initialSupply);
    }

    function deposit()
    external
    payable {
        _mint(msg.sender, msg.value);
        emit Transfer(address(0), msg.sender, msg.value);
    }

}
