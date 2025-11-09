// scripts/deploy.js
async function main() {
    const [deployer] = await ethers.getSigners();

    MasterLiquidityPool = await ethers.deployContract("MasterLiquidityPool");

    const DEX = await ethers.deployContract("DEX", [await MasterLiquidityPool.getAddress()])
    console.log(`DEX = ${await DEX.getAddress()}`)

    WETH10 = await ethers.deployContract("WETH10", [ethers.parseUnits("100000", 18)]);
    BNB = await ethers.deployContract("BNB", [ethers.parseUnits("100000", 18)]);
    TUSD = await ethers.deployContract("TUSD", [ethers.parseUnits("100000", 18)]);

    ADA = await ethers.deployContract("ADA", [ethers.parseUnits("100000", 18)]);
    LTC = await ethers.deployContract("LTC", [ethers.parseUnits("100000", 18)]);
    XCH = await ethers.deployContract("XCH", [ethers.parseUnits("100000", 18)]);

    console.log(`WETH10 = ${await WETH10.getAddress()}`)
    console.log(`BNB = ${await BNB.getAddress()}`)
    console.log(`TUSD = ${await TUSD.getAddress()}`)

    console.log(`ADA = ${await ADA.getAddress()}`)
    console.log(`LTC = ${await LTC.getAddress()}`)
    console.log(`XCH = ${await XCH.getAddress()}`)


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });