const hre = require("hardhat");
const {
  DEX_ADDRESS,
  WETH10_ADDRESS,
  BNB_ADDRESS,
  TUSD_ADDRESS,
  ADA_ADDRESS,
  LTC_ADDRESS,
  XCH_ADDRESS,
} = require("./utils");

async function main() {
  const [deployer, addr1] = await hre.ethers.getSigners();
  const SCALE = BigInt(1e18);

  console.log(`Using deployer: ${deployer.address}`);

  // Attach to deployed DEX
  const DEX = await ethers.getContractAt("DEX", DEX_ADDRESS);

  // Get MasterLiquidityPool from DEX
  let MasterLiquidityPool = await DEX.MasterLP();
  MasterLiquidityPool = new ethers.Contract(
    MasterLiquidityPool,
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
      {
        inputs: [
          { internalType: "address", name: "tokenPair0", type: "address" },
          { internalType: "address", name: "tokenPair1", type: "address" },
        ],
        name: "registerTokenPair",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    deployer
  );

  // Load tokens
  const BNB = await ethers.getContractAt("BNB", BNB_ADDRESS);
  const ADA = await ethers.getContractAt("ADA", ADA_ADDRESS);
  const WETH10 = await ethers.getContractAt("WETH10", WETH10_ADDRESS);
  const TUSD = await ethers.getContractAt("TUSD", TUSD_ADDRESS);
  const XCH = await ethers.getContractAt("XCH", XCH_ADDRESS);

  const setTokenAddresses = (address) => {
    switch (address.toLowerCase()) {
      case BNB_ADDRESS.toLowerCase():
        return BNB;
      case ADA_ADDRESS.toLowerCase():
        return ADA;
      case WETH10_ADDRESS.toLowerCase():
        return WETH10;
      case TUSD_ADDRESS.toLowerCase():
        return TUSD;
      case XCH_ADDRESS.toLowerCase():
        return XCH;
      default:
        throw new Error("Unknown token address");
    }
  };

  const createLiquidityPool = async (
    tokenPair0,
    tokenPair1,
    priceRatio = 1
  ) => {
    console.log(`\nCreating LP for ${tokenPair0} - ${tokenPair1}`);
    const tx = await MasterLiquidityPool.registerTokenPair(
      tokenPair0,
      tokenPair1
    );
    await tx.wait();

    const lp_addr = await MasterLiquidityPool.getLP(tokenPair0, tokenPair1);
    const lp = await ethers.getContractAt("LiquidityPool", lp_addr, deployer);

    const lp_tokenA = await lp.tokenA();
    const lp_tokenB = await lp.tokenB();

    const tokenA = setTokenAddresses(lp_tokenA);
    const tokenB = setTokenAddresses(lp_tokenB);

    await tokenA.approve(lp_addr, ethers.parseUnits("100", 18));
    await tokenB.approve(
      lp_addr,
      ethers.parseUnits((100 * priceRatio).toString(), 18)
    );

    const addTx = await lp.addLiquidity(
      ethers.parseUnits("100", 18),
      ethers.parseUnits((100 * priceRatio).toString(), 18)
    );
    await addTx.wait();

    console.log(`✅ Liquidity added: ${lp_tokenA}/${lp_tokenB} at ${lp_addr}`);

    const price = await lp.getMarketPrice(lp_tokenA, lp_tokenB);
    console.log(`Market price ${lp_tokenA} -> ${lp_tokenB}: ${price}`);

    return lp;
  };

  const addMoreLiquidity = async (tokenPair0, tokenPair1, amountA, amountB) => {
    console.log(`\n💰 Adding more liquidity to ${tokenPair0} - ${tokenPair1}`);

    const lp_addr = await MasterLiquidityPool.getLP(tokenPair0, tokenPair1);
    const lp = await ethers.getContractAt("LiquidityPool", lp_addr, deployer);

    const lp_tokenA = await lp.tokenA();
    const lp_tokenB = await lp.tokenB();

    const tokenA = setTokenAddresses(lp_tokenA);
    const tokenB = setTokenAddresses(lp_tokenB);

    // Approve and add liquidity
    await tokenA.approve(lp_addr, ethers.parseUnits(amountA.toString(), 18));
    await tokenB.approve(lp_addr, ethers.parseUnits(amountB.toString(), 18));

    const addTx = await lp.addLiquidity(
      ethers.parseUnits(amountA.toString(), 18),
      ethers.parseUnits(amountB.toString(), 18)
    );
    await addTx.wait();
  };

  // Create initial liquidity pools
  await createLiquidityPool(BNB_ADDRESS, XCH_ADDRESS, 1);
  await createLiquidityPool(BNB_ADDRESS, WETH10_ADDRESS, 4);
  await createLiquidityPool(BNB_ADDRESS, TUSD_ADDRESS, 2);
  await createLiquidityPool(ADA_ADDRESS, WETH10_ADDRESS, 1);
  await createLiquidityPool(ADA_ADDRESS, TUSD_ADDRESS, 3);

  console.log("\n" + "=".repeat(60));
  console.log("Adding additional liquidity to support trading...");
  console.log("=".repeat(60));

  // Add more liquidity to the pools (especially BNB/WETH for your demo)
  await addMoreLiquidity(BNB_ADDRESS, WETH10_ADDRESS, 100, 400); // Add 100 WETH, 400 BNB
  await addMoreLiquidity(BNB_ADDRESS, TUSD_ADDRESS, 50, 100); // Add 50 BNB, 100 TUSD
  await addMoreLiquidity(ADA_ADDRESS, WETH10_ADDRESS, 50, 50); // Add 50 ADA, 50 WETH

  const lpAddr = await MasterLiquidityPool.getLP(BNB_ADDRESS, TUSD_ADDRESS);
  console.log("\n" + "=".repeat(60));
  console.log("LP Address:", lpAddr);
  console.log("✅ All liquidity pools created and funded!");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
