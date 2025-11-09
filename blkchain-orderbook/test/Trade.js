const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MatchTrade", function () {
    let WETH10, BNB, TUSD, DEX;
    let WETH10_addr, BNB_addr, TUSD_addr, DEX_addr;
    let owner, addr1, addr2, addr3;
    const SCALE = BigInt(1e18)
    const OrderType = Object.freeze({
        Market: 0,
        Limit: 1,
        Stop: 2
      });

    function setTokenAddresses(address) {
        if (address === WETH10_addr)
          return WETH10
        else if (address === BNB_addr)
          return BNB
        else if (address === TUSD_addr)
          return TUSD
      }


    const createOrder = (orderType, price, quantity, tokenPair0, tokenPair1 ) => {
        return {
            orderType: orderType, // GoodTillCancel
            price: price,
            quantity: quantity,
            tokenPair0: tokenPair0,
            tokenPair1: tokenPair1,
        };
    };

    const approveOrder = async (order, addr, DEX_addr) => {
        token = setTokenAddresses(order.tokenPair0)
    
        await token.connect(addr).deposit({from: addr, value: order.quantity})
        await token.connect(addr).approve(DEX_addr, order.quantity)
    
        // remaining = await token.allowance(addr, DEX_addr);
        // console.log(remaining)
    
        return true
    };

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        WETH10 = await ethers.deployContract("WETH10", [ethers.parseUnits("100", 8)]);
        BNB = await ethers.deployContract("BNB", [ethers.parseUnits("100", 8)]);
        TUSD = await ethers.deployContract("TUSD", [ethers.parseUnits("100", 8)]);
        
        WETH10_addr = await WETH10.getAddress();
        BNB_addr = await BNB.getAddress();
        TUSD_addr = await TUSD.getAddress();

        DEX = await ethers.deployContract("DEX");
        DEX_addr = await DEX.getAddress()
    });

    describe("Match Limit Orders", function () {

        it("All Limit, ALL owe <= get (quantity not used)", async function () { 
            // 3A -> 3B, 9B -> 9C, 12C -> 2A    VALID

            const order1 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                SCALE,            // price
                ethers.parseUnits("3", 0),            // quantity
                BNB_addr,                             // tokenPair0
                WETH10_addr,                          // tokenPair1
            ); 

            const order2 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                SCALE,            // price
                ethers.parseUnits("9", 0),            // quantity
                WETH10_addr,                          // tokenPair0
                TUSD_addr,                            // tokenPair1
            ); 

            const order3 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE) / BigInt(5),            // price
                ethers.parseUnits("12", 0),            // quantity
                TUSD_addr,                            // tokenPair0
                BNB_addr,                             // tokenPair1
            );

            await approveOrder(order1, addr1, DEX_addr);
            await DEX.connect(addr1).addOrder(order1)
            await approveOrder(order2, addr1, DEX_addr);
            await DEX.connect(addr1).addOrder(order2)
            await approveOrder(order3, addr2, DEX_addr);
            await DEX.connect(addr2).addOrder(order3)



            await DEX.connect(addr3).matchTrade([1,2,3], [3,9,12])

            // reward : 6B (weth), 3C(tusd), 1A(bnb) 
            expect(await WETH10.balanceOf(addr3)).to.equal(6);
            expect(await TUSD.balanceOf(addr3)).to.equal(3);
            expect(await BNB.balanceOf(addr3)).to.equal(1);

            // use1 : 3B (weth), 9C (tusd), 
            // user 2 : 2A(bnb) 
            expect(await WETH10.balanceOf(addr1)).to.equal(3);
            expect(await TUSD.balanceOf(addr1)).to.equal(9);
            expect(await BNB.balanceOf(addr2)).to.equal(2);

            const orders = await DEX.getAllOrders();
            expect(orders.length).to.equal(0);

        });

        it("All Limit, ALL owe <= get (quantity used)", async function () { 
            // 12A -> 12B, 9B -> 9C, 12C -> 4A
            //  3A -> 3B, 5B -> 5C, 6C -> 2A  (VALID)
            
            const order1 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                SCALE,            // price
                ethers.parseUnits("12", 0),            // quantity
                BNB_addr,                             // tokenPair0
                WETH10_addr,                          // tokenPair1
            ); 

            const order2 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                SCALE,            // price
                ethers.parseUnits("9", 0),            // quantity
                WETH10_addr,                          // tokenPair0
                TUSD_addr,                            // tokenPair1
            ); 

            const order3 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE) / BigInt(6) + BigInt(SCALE) / BigInt(5),            // price
                ethers.parseUnits("6", 0),            // quantity
                TUSD_addr,                            // tokenPair0
                BNB_addr,                             // tokenPair1
            );

            await approveOrder(order1, addr1, DEX_addr);
            await DEX.connect(addr1).addOrder(order1)
            await approveOrder(order2, addr1, DEX_addr);
            await DEX.connect(addr1).addOrder(order2)
            await approveOrder(order3, addr2, DEX_addr);
            await DEX.connect(addr2).addOrder(order3)

            await DEX.connect(addr3).matchTrade([1,2,3], [3,5,6])

            // reward: 2B (weth), 1C(TUSD), 1A (bnb)
            expect(await WETH10.balanceOf(addr3)).to.equal(2);
            expect(await TUSD.balanceOf(addr3)).to.equal(1);
            expect(await BNB.balanceOf(addr3)).to.equal(1);

            // use1 : 3B (weth), 5C (tusd), 
            // user 2 : 2A(bnb) 
            expect(await WETH10.balanceOf(addr1)).to.equal(3);
            expect(await TUSD.balanceOf(addr1)).to.equal(5);
            expect(await BNB.balanceOf(addr2)).to.equal(2);

            const orders = await DEX.getAllOrders();
            expect(orders.length).to.equal(2);
        });

        it("All Limit, ALL owe > get (quantity used)", async function () { 
            // 3A -> 6B, 3B -> 6C, 1C -> 6A
            
            const order1 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE) * BigInt(2),            // price
                ethers.parseUnits("3", 0),            // quantity
                BNB_addr,                             // tokenPair0
                WETH10_addr,                          // tokenPair1
            ); 

            const order2 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE) * BigInt(2),            // price
                ethers.parseUnits("6", 0),            // quantity
                WETH10_addr,                          // tokenPair0
                TUSD_addr,                            // tokenPair1
            ); 

            const order3 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE) * BigInt(6),            // price
                ethers.parseUnits("6", 0),            // quantity
                TUSD_addr,                            // tokenPair0
                BNB_addr,                             // tokenPair1
            );

            await approveOrder(order1, addr1, DEX_addr);
            await DEX.connect(addr1).addOrder(order1)
            await approveOrder(order2, addr1, DEX_addr);
            await DEX.connect(addr1).addOrder(order2)
            await approveOrder(order3, addr2, DEX_addr);
            await DEX.connect(addr2).addOrder(order3)

            await expect(
                DEX.connect(addr3).matchTrade([1, 2, 3], [3, 3, 1])
            ).to.be.revertedWith("limit order, invalid pricing");
        });

        it("All Limit, ALL owe == get (quantity used)", async function () { 
            // 3A -> 6B, 6B -> 6C, 6C -> 3A
            
            const order1 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE) * BigInt(2),            // price
                ethers.parseUnits("3", 0),            // quantity
                BNB_addr,                             // tokenPair0
                WETH10_addr,                          // tokenPair1
            ); 

            const order2 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE),            // price
                ethers.parseUnits("6", 0),            // quantity
                WETH10_addr,                          // tokenPair0
                TUSD_addr,                            // tokenPair1
            ); 

            const order3 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE) / BigInt(2),            // price
                ethers.parseUnits("6", 0),            // quantity
                TUSD_addr,                            // tokenPair0
                BNB_addr,                             // tokenPair1
            );

            await approveOrder(order1, addr1, DEX_addr);
            await DEX.connect(addr1).addOrder(order1)
            await approveOrder(order2, addr1, DEX_addr);
            await DEX.connect(addr1).addOrder(order2)
            await approveOrder(order3, addr2, DEX_addr);
            await DEX.connect(addr2).addOrder(order3)

            
            await DEX.connect(addr3).matchTrade([1, 2, 3], [3, 6, 6])

            // reward: null
            expect(await WETH10.balanceOf(addr3)).to.equal(0);
            expect(await TUSD.balanceOf(addr3)).to.equal(0);
            expect(await BNB.balanceOf(addr3)).to.equal(0);

            // use1 : 6B (weth), 6C (tusd), 
            // user 2 : 3A(bnb) 
            expect(await WETH10.balanceOf(addr1)).to.equal(6);
            expect(await TUSD.balanceOf(addr1)).to.equal(6);
            expect(await BNB.balanceOf(addr2)).to.equal(3);

            const orders = await DEX.getAllOrders();
            expect(orders.length).to.equal(0);
        });
        
        it("All Limit, ALL owe ?? get MIX", async function () { 
            // 3A -> 3B,  6B -> 6C, 1C->6A
            
            const order1 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE) * BigInt(2),            // price
                ethers.parseUnits("3", 0),            // quantity
                BNB_addr,                             // tokenPair0
                WETH10_addr,                          // tokenPair1
            ); 

            const order2 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE),            // price
                ethers.parseUnits("6", 0),            // quantity
                WETH10_addr,                          // tokenPair0
                TUSD_addr,                            // tokenPair1
            ); 

            const order3 = createOrder(
                OrderType.Limit,                      // orderType -> Limit
                BigInt(SCALE) * BigInt(6),            // price
                ethers.parseUnits("1", 0),            // quantity
                TUSD_addr,                            // tokenPair0
                BNB_addr,                             // tokenPair1
            );

            await approveOrder(order1, addr1, DEX_addr);
            await DEX.connect(addr1).addOrder(order1)
            await approveOrder(order2, addr1, DEX_addr);
            await DEX.connect(addr1).addOrder(order2)
            await approveOrder(order3, addr2, DEX_addr);
            await DEX.connect(addr2).addOrder(order3)

            await expect(
                DEX.connect(addr3).matchTrade([1, 2, 3], [3, 6, 1])
            ).to.be.revertedWith("limit order, invalid pricing");
        });

    });


});
