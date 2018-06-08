pragma solidity ^0.4.18;

contract SimpleStorage {
  uint storedData;
  uint x;

  function set(uint y) public {
    storedData = y;
    x = y;
  }

  function get() public view returns (uint) {
    return storedData;
    return x;
  }
}
