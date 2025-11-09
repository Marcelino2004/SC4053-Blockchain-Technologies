const hre = require("hardhat");
const { DEX_ADDRESS, WETH10_ADDRESS, BNB_ADDRESS } = require("./utils");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log(`Using account: ${deployer.address}`);

  // Attach to contracts
  const DEX = await ethers.getContractAt("DEX", DEX_ADDRESS);
  const WETH = await ethers.getContractAt("WETH10", WETH10_ADDRESS);
  const BNB = await ethers.getContractAt("BNB", BNB_ADDRESS);

  // Get MasterLP
  const MasterLPAddress = await DEX.MasterLP();
  const MasterLP = await ethers.getContractAt(
    [
      {
        inputs: [
          { internalType: "address", name: "tokenPair0", type: "address" },
          { internalType: "address", name: "tokenPair1", type: "address" },
        ],
        name: "getLP",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    MasterLPAddress
  );

  // Get LP address
  const lpAddr = await MasterLP.getLP(WETH10_ADDRESS, BNB_ADDRESS);
  console.log(`LP Address: ${lpAddr}`);

  const LP = await ethers.getContractAt("LiquidityPool", lpAddr);

  // Check current price
  console.log("\n=== Initial State ===");

  try {
    const initialPrice = await LP.getMarketPrice(WETH10_ADDRESS, BNB_ADDRESS);
    console.log(
      `Current price: 1 WETH = ${ethers.formatUnits(initialPrice, 18)} BNB`
    );
  } catch (e) {
    console.log("Could not fetch initial market price");
  }

  // Check balances
  const wethBalance = await WETH.balanceOf(deployer.address);
  const bnbBalance = await BNB.balanceOf(deployer.address);
  console.log(
    `Your balance: ${ethers.formatUnits(
      wethBalance,
      18
    )} WETH, ${ethers.formatUnits(bnbBalance, 18)} BNB`
  );

  console.log("\n=== Strategy ===");
  console.log("We'll buy WETH using BNB in small increments.");
  console.log("This will push the price of WETH up (more BNB per WETH).");
  console.log(
    "Once the price reaches your limit order threshold, it should trigger."
  );

  // Perform multiple small trades to push the price up
  const numberOfTrades = 5;
  const bnbPerTrade = "0.5"; // 0.5 BNB per trade

  console.log(
    `\n=== Executing ${numberOfTrades} trades of ${bnbPerTrade} BNB each ===`
  );

  for (let i = 1; i <= numberOfTrades; i++) {
    console.log(`\n--- Trade ${i}/${numberOfTrades} ---`);

    // Approve BNB
    const bnbAmount = ethers.parseUnits(bnbPerTrade, 18);
    const approveTx = await BNB.approve(DEX_ADDRESS, bnbAmount);
    await approveTx.wait();
    console.log(`✓ Approved ${bnbPerTrade} BNB`);

    // Create the InputOrder struct
    // orderType: 0 = Market, 1 = Limit, 2 = Stop
    const inputOrder = {
      orderType: 0, // Market order
      price: ethers.parseUnits("1", 18), // Price (irrelevant for market orders)
      quantity: bnbAmount, // Quantity of BNB we're selling
      tokenPair0: BNB_ADDRESS, // Token we have (BNB)
      tokenPair1: WETH10_ADDRESS, // Token we want (WETH)
    };

    console.log("Creating market order to buy WETH with BNB...");

    // Execute market order using the InputOrder struct
    const tx = await DEX.addOrder(inputOrder);
    const receipt = await tx.wait();
    console.log(`✓ Trade executed (tx: ${receipt.hash})`);

    // Check new price
    try {
      const newPrice = await LP.getMarketPrice(WETH10_ADDRESS, BNB_ADDRESS);
      console.log(
        `New price: 1 WETH = ${ethers.formatUnits(newPrice, 18)} BNB`
      );
    } catch (e) {
      console.log("Price updated");
    }

    // Wait a bit between trades
    console.log("Waiting 2 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n=== Final State ===");

  try {
    const finalPrice = await LP.getMarketPrice(WETH10_ADDRESS, BNB_ADDRESS);
    console.log(
      `Final price: 1 WETH = ${ethers.formatUnits(finalPrice, 18)} BNB`
    );
  } catch (e) {
    console.log("Could not fetch final price");
  }

  const finalWethBalance = await WETH.balanceOf(deployer.address);
  const finalBnbBalance = await BNB.balanceOf(deployer.address);

  const wethGained =
    parseFloat(ethers.formatUnits(finalWethBalance, 18)) -
    parseFloat(ethers.formatUnits(wethBalance, 18));
  const bnbSpent =
    parseFloat(ethers.formatUnits(bnbBalance, 18)) -
    parseFloat(ethers.formatUnits(finalBnbBalance, 18));

  console.log(
    `Your final balance: ${ethers.formatUnits(
      finalWethBalance,
      18
    )} WETH, ${ethers.formatUnits(finalBnbBalance, 18)} BNB`
  );
  console.log(`\n📊 Trade Summary:`);
  console.log(`   Spent: ${bnbSpent.toFixed(4)} BNB`);
  console.log(`   Received: ${wethGained.toFixed(4)} WETH`);
  if (wethGained > 0) {
    console.log(
      `   Effective price: ${(bnbSpent / wethGained).toFixed(4)} BNB per WETH`
    );
  }

  console.log(
    "\n✅ Done! Your limit order watcher should now detect the price change and start executing partial fills."
  );
  console.log(
    "\n💡 Tip: If the price didn't increase enough, run this script again or increase the trade amounts."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
