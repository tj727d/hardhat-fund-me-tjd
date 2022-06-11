const { network } = require("hardhat");
require("dotenv").config();
const { verify } = require("../utils/verify");

module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre;

    const { deploy, log } = deployments;
    //pulls named accounts from hardhat.config and takes the deployer account that is specified
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    const {
        networkConfig,
        developmentChains,
    } = require("../helper-hardhat-config");

    //What if we want to change chains???

    // When using loclhost or hardhat network we want to use a mock

    //if on development chain, get mock aggregator contract else use a real aggregator contract
    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        //get the most recent deployment of Mock contract's address
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    //create mock contract for local testnets
    //if a contract doesn't exist, we deploy a minimal version of it for our local testnet

    //deploy
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //put pricefeed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    //verify contract if deployed to a live chain
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }
    log("--------------------------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
