// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20, AccessControl {
    bytes32 public constant MINTER = keccak256("MINTER");

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantRole(MINTER, msg.sender);
    }

    function mint(uint256 amount, address to) external onlyRole(MINTER) {
        _mint(to, amount);
    }

    function burn(uint256 amount, address from) external onlyRole(MINTER) {
        _burn(from, amount);
    }
}
