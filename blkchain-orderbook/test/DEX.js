const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("DEX", function () {
  let WETH10, BNB, TUSD, DEX;
  let WETH10_addr, BNB_addr, TUSD_addr, DEX_addr;
  let tokenAmount;
  let owner, attacker, addr1, addr2, addr3;
  let abi;
  let SCALE;
  
  const lp_abi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_tokenB",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "SCALE",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        }
      ],
      "name": "addLiquidity",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "tokenIn",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenOut",
          "type": "address"
        }
      ],
      "name": "getMarketPrice",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "priceOfAinB",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "priceOfBinA",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "tokenIn",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenOut",
          "type": "address"
        }
      ],
      "name": "swap",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amountout",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenA",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenB",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupplyA",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupplyB",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
  
  const OrderType = Object.freeze({
    Market: 0,
    Limit: 1,
    Stop: 2
  });

  const createOrder = (orderType, price, quantity, tokenPair0, tokenPair1 ) => {
    return {
      orderType: orderType, // GoodTillCancel
      price: price,
      quantity: quantity,
      tokenPair0: tokenPair0,
      tokenPair1: tokenPair1,
    };
  };

  function setTokenAddresses(address) {
    if (address === WETH10_addr)
      return WETH10
    else if (address === BNB_addr)
      return BNB
    else if (address === TUSD_addr)
      return TUSD
  }

  const createLiquidityPool = async (tokenPair0, tokenPair1, priceRatio=1) => {
    //console.log("am i called?")

    await MasterLiquidityPool.registerTokenPair(tokenPair0, tokenPair1)
    lp_addr = await MasterLiquidityPool.getLP(tokenPair0, tokenPair1)
    //console.log(`lp: ${lp_addr}`)
    lp = new ethers.Contract(lp_addr, lp_abi, owner);
    lp_tokenA = await lp.tokenA()
    lp_tokenB = await lp.tokenB()
    // 100 bnb -> 200 weth
    // price ratio is tokenPair0 (bnb) -> ratio * tokenPair 1 (weth)
    if (await tokenPair0 == lp_tokenA){
      //console.log("true")
      tokenA = setTokenAddresses(lp_tokenA)
      tokenB = setTokenAddresses(lp_tokenB)
      await tokenA.approve(lp_addr, 100)
      await tokenB.approve(lp_addr, 100*priceRatio)

      await lp.addLiquidity(100, 100*priceRatio)

      // console.log(`balance of tokenA lp: ${await tokenA.balanceOf(lp_addr)}`)
      // console.log(`balance of tokenB lp: ${await tokenB.balanceOf(lp_addr)}`)

    }else{
      //console.log("false")

      tokenA = setTokenAddresses(lp_tokenA)
      tokenB = setTokenAddresses(lp_tokenB)

      await tokenA.approve(lp_addr, 100*priceRatio)
      await tokenB.approve(lp_addr, 100)

      await lp.addLiquidity(100*priceRatio, 100)

      // console.log(`balance of tokenA lp: ${await tokenA.balanceOf(lp_addr)}`)
      // console.log(`balance of tokenB lp: ${await tokenB.balanceOf(lp_addr)}`)
    }

    return lp
  }

  const approveOrder = async (order, addr) => {
    token = setTokenAddresses(order.tokenPair0)

    await token.connect(addr).deposit({from: addr, value: order.quantity})
    await token.connect(addr).approve(DEX_addr, order.quantity)

    return true
  };

  beforeEach(async function() {
    WETH10 = await ethers.deployContract("WETH10", [ethers.parseUnits("10000", 8)]);
    BNB = await ethers.deployContract("BNB", [ethers.parseUnits("10000", 8)]);
    TUSD = await ethers.deployContract("TUSD", [ethers.parseUnits("10000", 8)]);
    MasterLiquidityPool = await ethers.deployContract("MasterLiquidityPool");
    DEX = await ethers.deployContract("DEX", [await MasterLiquidityPool.getAddress()]);


    [owner, attacker, addr1, addr2, addr3] = await ethers.getSigners();
    tokenAmount = ethers.parseUnits("10", 8);

    await Promise.all([
      WETH10.connect(addr1).deposit({ from: addr1, value: tokenAmount }),
      BNB.connect(addr1).deposit({ from: addr1, value: tokenAmount }),
      TUSD.connect(addr1).deposit({ from: addr1, value: tokenAmount }),
    ]);

    abi = ethers.AbiCoder.defaultAbiCoder();
    
    DEX_addr = await DEX.getAddress();
    WETH10_addr = await WETH10.getAddress();
    BNB_addr = await BNB.getAddress();
    TUSD_addr = await TUSD.getAddress();

    SCALE = await DEX.SCALE()

  });

  describe("Market Orders", function(){
    let tokenQuantity, lp

    beforeEach(async function () {
      tokenQuantity = ethers.parseUnits("5", 0)
      lp = await createLiquidityPool(BNB_addr, WETH10_addr, 2)
    })

    it("should have the correct market price", async function(){
      // Check price for BNB to WETH10 (1 bnb -> 2 weth)
      let num = await lp.getMarketPrice(BNB_addr, WETH10_addr);
      expect(num).to.equal(SCALE * BigInt(2));

      // Check price for WETH10 to BNB (1 weth -> 0.5 bnb)
      num = await lp.getMarketPrice(WETH10_addr, BNB_addr);
      expect(num).to.equal(SCALE / BigInt(2));
    })

    it("should add market order (1) and execute it directly", async function () {
      // market price will be set to 1 to 1
      const marketOrder = createOrder(
        OrderType.Market,                      // orderType -> Normal
        0,                                     // price
        tokenQuantity,                         // quantity
        BNB_addr,                              // tokenPair0
        WETH10_addr,                           // tokenPair1
      ); 
      
      const approve = await approveOrder(marketOrder, addr1);
      
      // should execute at 5A -> 5B
      await expect(DEX.connect(addr1).addOrder(marketOrder))
        .to.emit(DEX, "ExecuteMarketOrder")
        .withArgs(1, tokenQuantity, ethers.parseUnits("10", 0))
      
      // check the final liquidity pool should be 
      // 100bnb -> 200weth bcms 105bnb -> 190weth 
      let totalSupplyA = await lp.totalSupplyA();
      expect(totalSupplyA).to.equal(105);
      let totalSupplyB = await lp.totalSupplyB();
      expect(totalSupplyB).to.equal(190);
    });
   
  
    it("should add market order (2) and execute it directly", async function () {
      // market price will be set to 1 to 1
      const marketOrder = createOrder(
        OrderType.Market,                      // orderType -> Normal
        0,                                     // price
        tokenQuantity,                         // quantity
        WETH10_addr,                              // tokenPair0
        BNB_addr,                           // tokenPair1
      ); 
      
      const approve = await approveOrder(marketOrder, addr1);
  
      // should execute at 5A -> 5B
      await expect(DEX.connect(addr1).addOrder(marketOrder))
        .to.emit(DEX, "ExecuteMarketOrder")
        .withArgs(1, tokenQuantity, ethers.parseUnits("2", 0))
      
      // check the final liquidity pool should be 
      // 100bnb -> 200weth bcms 98bnb -> 205weth 
      let totalSupplyA = await lp.totalSupplyA();
      expect(totalSupplyA).to.equal(98);
      let totalSupplyB = await lp.totalSupplyB();
      expect(totalSupplyB).to.equal(205);
      
    });
  
  })

  describe("Limit Orders", function(){
    let tokenQuantity, lp

    beforeEach(async function () {
      tokenQuantity = ethers.parseUnits("5", 0)
      lp = await createLiquidityPool(BNB_addr, WETH10_addr, 2)
    })

    it("should have the correct market price", async function(){
      // Check price for BNB to WETH10 (1 bnb -> 2 weth)
      let num = await lp.getMarketPrice(BNB_addr, WETH10_addr);
      expect(num).to.equal(SCALE * BigInt(2));

      // Check price for WETH10 to BNB (1 weth -> 0.5 bnb)
      num = await lp.getMarketPrice(WETH10_addr, BNB_addr);
      expect(num).to.equal(SCALE / BigInt(2));
    })

    it("should add execute order, when given executable limit order", async function () {
      // market price will be set to 1 to 1
      // 1 bnb -> 2 weth
      // order = 1bnb -> 3 weth
      const marketOrder = createOrder(
        OrderType.Limit,                      // orderType -> Normal
        SCALE * BigInt(3),                                     // price
        tokenQuantity,                         // quantity
        BNB_addr,                              // tokenPair0
        WETH10_addr,                           // tokenPair1
      ); 
      
      const approve = await approveOrder(marketOrder, addr1);
      
      // should execute at 5A -> 10B
      let original_BNB_1 = await BNB.balanceOf(addr1);
      let original_WETH10_1 = await WETH10.balanceOf(addr1);

      await DEX.connect(addr1).addOrder(marketOrder)

      let final_BNB_1 = await BNB.balanceOf(addr1);
      let final_WETH10_1 = await WETH10.balanceOf(addr1);

      expect(final_BNB_1).to.equal(original_BNB_1 - BigInt(5));
      expect(final_WETH10_1).to.equal(original_WETH10_1 + BigInt(10));

      orderList = await DEX.getAllOrders()
      expect(orderList.length).to.equal(0)
      
    })

    it("should add create order, when given NON-executable limit order", async function () {
      // market price will be set to 1 to 1
      // 1 bnb -> 2 weth
      // order = 1bnb -> 3 weth
      const marketOrder = createOrder(
        OrderType.Limit,                      // orderType -> Normal
        SCALE / BigInt(2),                                     // price
        tokenQuantity,                         // quantity
        BNB_addr,                              // tokenPair0
        WETH10_addr,                           // tokenPair1
      ); 
      
      const approve = await approveOrder(marketOrder, addr1);
      
      // should execute at 5A -> 10B
      let original_BNB_1 = await BNB.balanceOf(addr1);
      let original_WETH10_1 = await WETH10.balanceOf(addr1);

      await DEX.connect(addr1).addOrder(marketOrder)

      let final_BNB_1 = await BNB.balanceOf(addr1);
      let final_WETH10_1 = await WETH10.balanceOf(addr1);

      expect(final_BNB_1).to.equal(original_BNB_1 - BigInt(tokenQuantity));
      expect(final_WETH10_1).to.equal(original_WETH10_1);

      orderList = await DEX.getAllOrders()
      expect(orderList.length).to.equal(1)
      
    })
  
  })

  describe("Match Limit Order", function(){
    let tokenQuantity, lp

    beforeEach(async function () {
      tokenQuantity = ethers.parseUnits("5", 0)
      lp = await createLiquidityPool(BNB_addr, WETH10_addr, 2)
    })

    it("should have the correct market price", async function(){
      // Check price for BNB to WETH10 (1 bnb -> 2 weth)
      let num = await lp.getMarketPrice(BNB_addr, WETH10_addr);
      expect(num).to.equal(SCALE * BigInt(2));

      // Check price for WETH10 to BNB (1 weth -> 0.5 bnb)
      num = await lp.getMarketPrice(WETH10_addr, BNB_addr);
      expect(num).to.equal(SCALE / BigInt(2));
    })

    it("should not execute illegal limit order", async function () {
      // 1 bnb -> 2 weth
      // order = 1bnb -> 1weth
      // will not execute
      const marketOrder = createOrder(
        OrderType.Limit,                      // orderType -> Normal
        SCALE,                                     // price
        tokenQuantity,                         // quantity
        BNB_addr,                              // tokenPair0
        WETH10_addr,                           // tokenPair1
      ); 
      
      const approve = await approveOrder(marketOrder, addr1);
      
      await DEX.connect(addr1).addOrder(marketOrder)
      await expect(
          DEX.connect(addr2).matchTrade([1], [5])
      ).to.be.revertedWith("Price of the limit order has not met requirement to be executed yet");

    });

    it("should execute legal limit order (full quantity)", async function () {
      // 1 bnb -> 2 weth
      // order = 1bnb -> 3weth
      // order = 5bnb -> 15?? 
      // will not execute
      const marketOrder = createOrder(
        OrderType.Limit,                      // orderType -> Normal
        SCALE * BigInt(3),                                     // price
        tokenQuantity,                         // quantity
        BNB_addr,                              // tokenPair0
        WETH10_addr,                           // tokenPair1
      ); 
      
      const approve = await approveOrder(marketOrder, addr1);
      
      let original_BNB_1 = await BNB.balanceOf(addr1);
      let original_WETH10_1 = await WETH10.balanceOf(addr1);

      //console.log("Original BNB balance: ", original_BNB_1);
      //console.log("Original WETH balance: ", original_WETH10_1);

      await DEX.connect(addr1).addOrder(marketOrder)
      DEX.connect(addr2).matchTrade([1], [5])

      let final_BNB_1 = await BNB.balanceOf(addr1);
      let final_WETH10_1 = await WETH10.balanceOf(addr1);

      // Log final balances
      //console.log("Final BNB balance: ", final_BNB_1 );
      //console.log("Final WETH balance: ", final_WETH10_1);
            
      expect(final_BNB_1).to.equal(original_BNB_1 - BigInt(5));
      expect(final_WETH10_1).to.equal(original_WETH10_1 + BigInt(10));

      orderList = await DEX.getAllOrders()
      expect(orderList.length).to.equal(0)
    
    });
      
  })

  describe("Match Stop Order", function(){
    let tokenQuantity, lp

    beforeEach(async function () {
      tokenQuantity = ethers.parseUnits("5", 0)
      lp = await createLiquidityPool(BNB_addr, WETH10_addr, 2)
    })

    it("should have the correct market price", async function(){
      // Check price for BNB to WETH10 (1 bnb -> 2 weth)
      let num = await lp.getMarketPrice(BNB_addr, WETH10_addr);
      expect(num).to.equal(SCALE * BigInt(2));

      // Check price for WETH10 to BNB (1 weth -> 0.5 bnb)
      num = await lp.getMarketPrice(WETH10_addr, BNB_addr);
      expect(num).to.equal(SCALE / BigInt(2));
    })

    it("should not execute illegal stop order", async function () {
      // 1 bnb -> 2 weth
      // order = 1bnb -> 3 weth
      // will not execute
      const marketOrder = createOrder(
        OrderType.Stop,                      // orderType -> Normal
        SCALE * BigInt(3),                                    // price
        tokenQuantity,                         // quantity
        BNB_addr,                              // tokenPair0
        WETH10_addr,                           // tokenPair1
      ); 
      
      const approve = await approveOrder(marketOrder, addr1);
      
      await DEX.connect(addr1).addOrder(marketOrder)
      
      await expect(
        DEX.connect(addr2).matchTrade([1], [5])
      ).to.be.revertedWith("Price of the stop order has not met requirement to be executed yet");
      
    });

    it("should execute legal stop order (full quantity)", async function () {
      // 1 bnb -> 2 weth
      // order = 1bnb -> 1weth
      // order = 5bnb -> 15?? 
      // will not execute
      const marketOrder = createOrder(
        OrderType.Stop,                      // orderType -> Normal
        SCALE,                                     // price
        tokenQuantity,                         // quantity
        BNB_addr,                              // tokenPair0
        WETH10_addr,                           // tokenPair1
      ); 
      
      const approve = await approveOrder(marketOrder, addr1);
      
      let original_BNB_1 = await BNB.balanceOf(addr1);
      let original_WETH10_1 = await WETH10.balanceOf(addr1);

      let original_WETH10_2 = await WETH10.balanceOf(addr2)
      
      // console.log("Original BNB balance: ", original_BNB_1);
      // console.log("Original WETH balance: ", original_WETH10_1);

      // console.log("miner original Weth balance: ", original_WETH10_2)

      await DEX.connect(addr1).addOrder(marketOrder)
      DEX.connect(addr2).matchTrade([1], [5])

      let final_BNB_1 = await BNB.balanceOf(addr1);
      let final_WETH10_1 = await WETH10.balanceOf(addr1);
  
      // Log final balances
      // console.log("Final BNB balance: ", final_BNB_1);
      // console.log("Final WETH balance: ", final_WETH10_1);

      // console.log("miner final Weth balance: ", final_WETH10_2)
            
      expect(final_BNB_1).to.equal(original_BNB_1 - BigInt(5));
      expect(final_WETH10_1).to.equal(original_WETH10_1 + BigInt(10));
      
      orderList = await DEX.getAllOrders()
      expect(orderList.length).to.equal(0)
    
    });
    //   // 1 bnb -> 2 weth
    //   // order = 1bnb -> 3weth
    //   // order = 5bnb -> 15?? 
    //   // will not execute
    //   const marketOrder = createOrder(
    //     OrderType.Stop,                      // orderType -> Normal
    //     SCALE,                                     // price
    //     tokenQuantity,                         // quantity
    //     BNB_addr,                              // tokenPair0
    //     WETH10_addr,                           // tokenPair1
    //   ); 
      
    //   const approve = await approveOrder(marketOrder, addr1);
      
    //   let original_BNB_1 = await BNB.balanceOf(addr1);
    //   let original_WETH10_1 = await WETH10.balanceOf(addr1);

    //   let original_WETH10_2 = await WETH10.balanceOf(addr2)
      
    //   // console.log("Original BNB balance: ", original_BNB_1);
    //   // console.log("Original WETH balance: ", original_WETH10_1);

    //   await DEX.connect(addr1).addOrder(marketOrder)
    //   DEX.connect(addr2).matchTrade([1], [3])

    //   let final_BNB_1 = await BNB.balanceOf(addr1);
    //   let final_WETH10_1 = await WETH10.balanceOf(addr1);
 
    //   // Log final balances
    //   //console.log("Final BNB balance: ", final_BNB_1);
    //   //console.log("Final WETH balance: ", final_WETH10_1);
    //   // 6 9
    //   expect(final_BNB_1).to.equal(original_BNB_1 - BigInt(5));
    //   expect(final_WETH10_1).to.equal(original_WETH10_1 + BigInt(6));
   
    //   orderList = await DEX.getAllOrders()
    //   expect(orderList.length).to.equal(1)
    
    // });
      
  })
  
})


