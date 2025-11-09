const { ethers } = require("hardhat");

const getOrderHash = (abi, DEX_address, order) => {
    return abi.encode(
      [
        "address", // userAddress 
        "address", // DEX_address
        "uint64", // orderType
        "uint64", // orderID
        "uint64", // side
        "uint", // price
        "uint32", // quantity
        "address",   // tokenPair0
        "address", //// tokenPair1
      ],
      [
        order.userAddress,
        DEX_address,
        order.orderType,
        order.orderID,
        order.side,
        order.price,
        order.quantity,
        order.tokenPair0,
        order.tokenPair1,
      ])
};

const getMatchOrderValues = (makerOrder, takerOrder) => {
    return [
        makerOrder.amount,
        makerOrder.pricepoint,
        makerOrder.side,
        makerOrder.salt,
        takerOrder.amount,
        takerOrder.pricepoint,
        takerOrder.side,
        takerOrder.salt,
        makerOrder.feeTake, //supposed to be the same for both orders
        makerOrder.feeMake //supposed to be the same for both orders
    ]
};

const getMatchOrderAddresses = (makerOrder, takerOrder) => {
    return [
        makerOrder.userAddress,
        takerOrder.userAddress,
        makerOrder.baseToken, //supposed to be the same for both orders
        makerOrder.quoteToken  //supposed to be the same for both orders
    ]
};


module.exports = { getOrderHash, getMatchOrderValues, getMatchOrderAddresses };