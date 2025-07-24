import hre from "hardhat";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    /* 1. Token */
    const LibertyToken = await hre.ethers.getContractFactory("LibertyToken");
    const token = await LibertyToken.deploy();
    await token.waitForDeployment();
    console.log("LIBERTY:", await token.getAddress());

    /* 2. DAO */
    const DAO = await hre.ethers.getContractFactory("LibertyDAO");
    const dao = await DAO.deploy(await token.getAddress());
    await dao.waitForDeployment();
    console.log("DAO:", await dao.getAddress());

    /* 3. Core contracts */
    const CR = await (await hre.ethers.getContractFactory("CreatorRegistry")).deploy();
    await CR.waitForDeployment();

    const NFT = await (await hre.ethers.getContractFactory("NFTAccess")).deploy();
    await NFT.waitForDeployment();

    const SM = await (await hre.ethers.getContractFactory("SubscriptionManager")).deploy();
    await SM.waitForDeployment();

    const RS = await (await hre.ethers.getContractFactory("RevenueSplitter")).deploy(await dao.getAddress());
    await RS.waitForDeployment();

    const CT = await (await hre.ethers.getContractFactory("ContentRegistry")).deploy(
        await CR.getAddress(), 
        await SM.getAddress(), 
        await NFT.getAddress()
    );
    await CT.waitForDeployment();

    console.table({
        LibertyToken: await token.getAddress(),
        CreatorRegistry: await CR.getAddress(),
        NFTAccess: await NFT.getAddress(),
        SubscriptionManager: await SM.getAddress(),
        RevenueSplitter: await RS.getAddress(),
        ContentRegistry: await CT.getAddress(),
        LibertyDAO: await dao.getAddress()
    });
}

main().catch((e) => { 
    console.error(e); 
    process.exit(1); 
});