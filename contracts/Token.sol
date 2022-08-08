// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Token {
    string public name;
    string public symbol;
    uint public totalSupply;
    uint8 public decimals = 18;
    address public minter;
    uint public mintableSupply;
    uint public initialSupply;
    mapping(address => uint) private balances;
    mapping(address => mapping(address => uint)) private allowances;

    event Transfer(address indexed from, address indexed to, uint amount);
    event Approve(address indexed owner, address indexed spender, uint amount);
    event Mint(uint amount);
    event Burn(uint amount);

    constructor() {
        name = "Dram";
        symbol = "AMD";
        totalSupply = 10000000000000000000000;
        minter = msg.sender;
        mintableSupply = 5000000000000000000000;
        initialSupply = 5000000000000000000000;
        balances[minter] = initialSupply;
    }

    function balanceOf(address owner) public view returns (uint) {
        return balances[owner];
    }

    function transfer(address to, uint amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Token: not enough funds");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Token: Not enough funds");
        allowances[msg.sender][spender] += amount;
        emit Approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint amount
    ) public returns (bool) {
        require(
            allowances[from][msg.sender] >= amount,
            "Token: not enough allowance"
        );
        require(balances[from] >= amount, "Token: not enough funds");
        allowances[from][msg.sender] -= amount;
        balances[from] -= amount;
        balances[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function allowance(address owner, address spender)
        public
        view
        returns (uint)
    {
        return allowances[owner][spender];
    }

    function mint(address to, uint amount) public returns (bool) {
        require(
            msg.sender == minter && mintableSupply >= amount,
            "Token: Can not mint"
        );
        mintableSupply -= amount;
        balances[to] += amount;
        emit Mint(amount);
        return true;
    }

    function burn(address from, uint amount) public returns (bool) {
        require(msg.sender == minter, "Not authorised to burn");
        require(balances[from] >= amount, "Token: Not enough funds");
        balances[from] -= amount;
        emit Burn(amount);
        return true;
    }
}
