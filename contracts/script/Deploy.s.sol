// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script} from "forge-std/Script.sol";
import "../src/ChitFundProtocol.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        new ChitFundProtocol();
        vm.stopBroadcast();
    }
}