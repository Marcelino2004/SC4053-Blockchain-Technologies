const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("DEX", function () {
  let WETH10, BNB, TUSD, DEX, ADA, LTC, XCH;
  let WETH10_addr, BNB_addr, TUSD_addr, DEX_addr, ADA_addr, LTC_addr, XCH_addr;
  let tokenAmount;
  let owner, addr1, addr2, addr3, addr4;
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
    else if (address == ADA_addr)
      return ADA
    else if (address == LTC_addr)
      return LTC
    else if (address == XCH_addr)
      return XCH
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

    //await token.connect(addr).deposit({from: addr, value: order.quantity})
    await token.connect(addr).approve(DEX_addr, order.quantity)

    return true
  };

  beforeEach(async function() {
    WETH10 = await ethers.deployContract("WETH10", [ethers.parseUnits("10000", 8)]);
    BNB = await ethers.deployContract("BNB", [ethers.parseUnits("10000", 8)]);
    TUSD = await ethers.deployContract("TUSD", [ethers.parseUnits("10000", 8)]);
    ADA = await ethers.deployContract("ADA", [ethers.parseUnits("10000", 8)]);
    LTC = await ethers.deployContract("LTC", [ethers.parseUnits("10000", 8)]);
    XCH = await ethers.deployContract("XCH", [ethers.parseUnits("10000", 8)]);

    MasterLiquidityPool = await ethers.deployContract("MasterLiquidityPool");
    DEX = await ethers.deployContract("DEX", [await MasterLiquidityPool.getAddress()]);

    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    tokenAmount = ethers.parseUnits("10", 8);

    await Promise.all([
      BNB.connect(addr1).deposit({ from: addr1, value: tokenAmount }),
      TUSD.connect(addr2).deposit({ from: addr2, value: tokenAmount }),
      ADA.connect(addr3).deposit({ from: addr3, value: tokenAmount }),
      LTC.connect(addr4).deposit({ from: addr4, value: tokenAmount }),
    ]);

    abi = ethers.AbiCoder.defaultAbiCoder();
    
    DEX_addr = await DEX.getAddress();
    
    WETH10_addr = await WETH10.getAddress();
    BNB_addr = await BNB.getAddress();
    ADA_addr = await ADA.getAddress();
    LTC_addr = await LTC.getAddress();
    TUSD_addr = await TUSD.getAddress();
    XCH_addr = await XCH.getAddress();

    SCALE = await DEX.SCALE()

  });

  describe("Multiple Trade Orders", function(){
    let tokenQuantity
    let lp1, lp2, lp3, lp4

    beforeEach(async function () {
      tokenQuantity = ethers.parseUnits("5", 0)
      lp1 = await createLiquidityPool(BNB_addr, TUSD_addr, 2)
      lp2 = await createLiquidityPool(TUSD_addr, ADA_addr, 1)
      lp3 = await createLiquidityPool(ADA_addr, LTC_addr, 1)
      lp4 = await createLiquidityPool(LTC_addr, BNB_addr, 0.5)
    })

    it("should correctly validate the cycle", async function(){
      const o1 = createOrder(
        OrderType.Limit,                      // orderType -> Normal
        SCALE * BigInt(2),                                     // price
        ethers.parseUnits("15", 0),                         // quantity
        BNB_addr,                              // tokenPair0
        TUSD_addr,                           // tokenPair1
      ); 

      const o2 = createOrder(
        OrderType.Limit,                      // orderType -> Normal
        SCALE,                                     // price
        ethers.parseUnits("20", 0),                         // quantity
        TUSD_addr,                              // tokenPair0
        ADA_addr,                           // tokenPair1
      ); 

      const o3 = createOrder(
        OrderType.Limit,                      // orderType -> Normal
        SCALE,                                     // price
        ethers.parseUnits("10", 0),                         // quantity
        ADA_addr,                              // tokenPair0
        LTC_addr,                           // tokenPair1
      ); 

      const o4 = createOrder(
        OrderType.Limit,                      // orderType -> Normal
        SCALE / BigInt(2),                                     // price
        ethers.parseUnits("12", 0),                         // quantity
        LTC_addr,                              // tokenPair0
        BNB_addr,                           // tokenPair1
      ); 

      let original_BNB_1 = await BNB.balanceOf(addr1);
      let original_TUSD_1 = await TUSD.balanceOf(addr1);

      // console.log("Original BNB balance: ", original_BNB_1);
      // console.log("Original TUSD balance: ", original_TUSD_1);

      let original_TUSD_2 = await TUSD.balanceOf(addr2);
      let original_ADA_2 = await ADA.balanceOf(addr2);

      let original_ADA_3 = await ADA.balanceOf(addr3);
      let original_LTC_3 = await LTC.balanceOf(addr3);

      let original_LTC_4 = await LTC.balanceOf(addr4);
      let original_BNB_4 = await BNB.balanceOf(addr4);

      approve = await approveOrder(o1, addr1); // 5B -> 10C
      approve = await approveOrder(o2, addr2); // 10C -> 10D
      approve = await approveOrder(o3, addr3); // 10D -> 10E
      approve = await approveOrder(o4, addr4); // 10E -> 5B


      await DEX.connect(addr1).addOrder(o1)
      await DEX.connect(addr2).addOrder(o2)
      await DEX.connect(addr3).addOrder(o3)
      await DEX.connect(addr4).addOrder(o4)

      await DEX.connect(addr2).matchTrade([1, 2, 3, 4], [5, 10, 10, 10])

      let final_BNB_1 = await BNB.balanceOf(addr1);
      let final_TUSD_1 = await TUSD.balanceOf(addr1);

      let final_TUSD_2 = await TUSD.balanceOf(addr2);
      let final_ADA_2 = await ADA.balanceOf(addr2);

      let final_ADA_3 = await ADA.balanceOf(addr3);
      let final_LTC_3 = await LTC.balanceOf(addr3);

      let final_LTC_4 = await LTC.balanceOf(addr4);
      let final_BNB_4 = await BNB.balanceOf(addr4);

      // console.log("Final BNB balance: ", final_BNB_1 , "actual: ", original_BNB_1 - BigInt(15));
      // console.log("Final TUSD balance: ", final_TUSD_1, "actual: ", original_TUSD_1 + BigInt(10));

      expect(final_BNB_1).to.equal(original_BNB_1 - BigInt(15));
      expect(final_TUSD_1).to.equal(original_TUSD_1 + BigInt(10));

      expect(final_TUSD_2).to.equal(original_TUSD_2 - BigInt(20));
      expect(final_ADA_2).to.equal(original_ADA_2 + BigInt(10));

      expect(final_ADA_3).to.equal(original_ADA_3 - BigInt(10));
      expect(final_LTC_3).to.equal(original_LTC_3 + BigInt(10));

      expect(final_LTC_4).to.equal(original_LTC_4 - BigInt(12));
      expect(final_BNB_4).to.equal(original_BNB_4 + BigInt(5));

      //1 -> sisa 10 , 2 -> sisa 10, 4-> sisa 2
      const orders = await DEX.getAllOrders();
      expect(orders[0].orderID).to.equal(1);
      expect(orders[0].quantity).to.equal(10);
      expect(orders[1].orderID).to.equal(2);
      expect(orders[1].quantity).to.equal(10);
      expect(orders[2].orderID).to.equal(4);
      expect(orders[2].quantity).to.equal(2);
    })

  })

  
})


