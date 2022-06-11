const { network } = require("hardhat");
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config");

module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre;

    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    //only deploy mocks to local testnets
    if (network.config.chainId == 31337) {
        log("Local network detected! Deployin Mock Contracts...");
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        });
        log("Mocks deployed!");
        log("---------------------------------------------------------");
    }
};

//allows you to choose to deploy all contracts or just mocks
module.exports.tags = ["all", "mocks"];
