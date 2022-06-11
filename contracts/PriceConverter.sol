//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7; //version of solidity (always at the top of a contract) ^ means this version or higher

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        //NEDD External contract ABI
        //and Address (0x8A753747A1Fa494EC906cE90E9f37563A8AF630e RINKEBY)

        (, int256 price, , , ) = priceFeed.latestRoundData(); //ETH in terms of usd
        return uint256(price * 1e10);
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        //convert eth to usd and return amount in usd
        uint256 ethPrice = getPrice(priceFeed);
        // ETH/USD Price = 3000_00000000000000
        // 1_000000000000000000 ETH is sent
        //
        uint256 ethAmountInUSD = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUSD;
    }
}
