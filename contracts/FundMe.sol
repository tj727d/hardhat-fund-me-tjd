//SPDX-License-Identifier: MIT
//pragma
pragma solidity ^0.8.7; //version of solidity (always at the top of a contract) ^ means this version or higher

// Get Funds from users
// Withdraw funds
// Set minimum funding value in USD
//imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

// tricks to minimize gas
// constant and immutable keywords for variables save gas
// use errors instead of requires

//errors
error FundMe__NotOwner();

//interfaces, libraries

//contracts
//natspec commenting
/** @title a contract for crowd funding
 *  @author TJ D'Alessandro
 *  @notice This contract is to demo  a sample funding contract
 *  @dev This implements price feeds as our library
 */
contract FundMe {
    //Type declarations
    //s_ before a variable name denotes it is a storage variable
    // using the library price converter for uint256
    using PriceConverter for uint256;
    // function for users to send money to the contract

    //State Variables
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] private s_funders;

    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    //Events and modifiers

    // _; is the code in the function
    // so this modifier runs the require first and then the function
    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Sender is not owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    //Functions
    // Group functions in the following order
    //// Constructor
    //// recieve
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    //called on contract deployment
    constructor(address priceFeedAddress) {
        //working with i_ (immutable) variables use less gas
        i_owner = msg.sender;
        //working with s_ (storage) variables use a lot of gas
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    //what happens if someone sends this contract ETH without calling the fund function

    //two functions that can be used to handle funds recieved by the contract are
    // recieve() is only called when a transaction has no call data
    // fallback

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     *  @notice This function funds this contract
     *  @dev This implements price feeds as our library
     */
    // A function must be payable in ourder to accept payment
    function fund() public payable {
        // Want to be able to set a minimum fund amount in usd
        // 1.How do we send ETH to thiscontract?

        // require the value sent to be at least 1 ETH
        // if the condition for the require isn't met, it will revert the transaction with the contract with the message put in the statement

        //rever means to undo any action before the require statement, and send the remaining gas back
        //msg.value is the value sent to the function

        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Donation did not meet minimum amount"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    // function for the owner of the contract to withdraw the funds provided

    // modifier is a keyword that can be added to the function declaration
    // to modify the function with the modifiers functionality before running the rest of the function
    function withdraw() public onlyOwner {
        /* for (starting index, ending index, step amount){
            code    
        }
        */
        // clear funders amount
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // reset the array
        // create a empty new array
        s_funders = new address[](0);
        //withdraw funds
        // 3 ways to send funds from a contract are transfer send and call

        // //transfer
        // //address(this) is the address of the contract
        // payable(msg.sender.transfer(address(this).balance));

        // //send
        // bool sendSuccess = (payable(msg.sender).send(address(this).balance));
        // require(sendSuccess, "Send failed");

        //call (recomended way to send eth)
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        //read funders array into memory once and then work with it instead of constantly reading from storage (Much cheaper)
        address[] memory funders = s_funders;
        // mapping can't be in memory (sorry:()
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0; //still storage because its a mapping
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    //getter functions to mask the prefixes of variables and allow for
    //private variables to be accessed

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
