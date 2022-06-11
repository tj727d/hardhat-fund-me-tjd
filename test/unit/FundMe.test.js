const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { _toEscapedUtf8String } = require("ethers/lib/utils");
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendAmount = ethers.utils.parseEther("1"); // 1 eth
          beforeEach(async () => {
              //deploy fundme contract using hardhat deploy (includes mocks)

              //fixture allows you to run deploy folder with as many tags as you want
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              //get the most recently deployed "FundMe" contract deployed from the deployer account
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", async () => {
              it("Sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("Fund", async () => {
              it("fails if not enough ETH is sent", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Donation did not meet minimum amount"
                  );
              });

              it("updates the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendAmount });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendAmount.toString());
              });
              it("adds funder to array of funders", async () => {
                  await fundMe.fund({ value: sendAmount });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("Withdraw", async () => {
              //before running the withdraw tests, fund the contract
              beforeEach(async () => {
                  await fundMe.fund({ value: sendAmount });
              });
              it("withdraw ETH from a single funder", async () => {
                  //Arrange
                  //Get contract balance after it is funded
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  //Get deployers balance before withdrawl
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  //Act
                  // withdraw funds to deployer
                  const transactionResponse = await fundMe.withdraw();
                  //confirm transaction by waiting a block
                  const transactionReceipt = await transactionResponse.wait(1);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  //gasCost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  //Assert

                  assert.equal(endingFundMeBalance, 0); //0 because all of the balance should have been withdrawn

                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });
              it("withdraw ETH from multiple funders", async () => {
                  //Arragnge
                  //create multiple accounts to fund the contract with
                  const accounts = await ethers.getSigners();
                  //connect 5 accounts to fundMe contract and have each of them send an ETH
                  for (let i = 1; i < 6; i++) {
                      //connect 5 accounts to fundm
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );

                      await fundMeConnectedContract.fund({ value: sendAmount });
                  }
                  //Get contract balance after it is funded
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  //Get deployers balance before withdrawl
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  //Act
                  // withdraw funds to deployer
                  const transactionResponse = await fundMe.withdraw();
                  //confirm transaction by waiting a block
                  const transactionReceipt = await transactionResponse.wait(1);
                  //gasCost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  //Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  assert.equal(endingFundMeBalance, 0); //0 because all of the balance should have been withdrawn

                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
                  //Make sure Funders array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it("Only allows the owner to withdraw funds", async () => {
                  //create an account that is not the deployer to try to withdraw funds
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  );

                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner");
              });
              it("cheaper withdraw", async () => {
                  //Arragnge
                  //create multiple accounts to fund the contract with
                  const accounts = await ethers.getSigners();
                  //connect 5 accounts to fundMe contract and have each of them send an ETH
                  for (let i = 1; i < 6; i++) {
                      //connect 5 accounts to fundm
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );

                      await fundMeConnectedContract.fund({ value: sendAmount });
                  }
                  //Get contract balance after it is funded
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  //Get deployers balance before withdrawl
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  //Act
                  // withdraw funds to deployer
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  //confirm transaction by waiting a block
                  const transactionReceipt = await transactionResponse.wait(1);
                  //gasCost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  //Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  assert.equal(endingFundMeBalance, 0); //0 because all of the balance should have been withdrawn

                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
                  //Make sure Funders array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });
          });
      });
