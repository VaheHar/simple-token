const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token contract", function () {
  async function deployTokenFixture() {
    const Token = await ethers.getContractFactory("Token");
    const [owner, caller, otherAccount] = await ethers.getSigners();
    const token = await Token.deploy();
    await token.deployed();
    return { token, owner, caller, otherAccount };
  }

  describe("Deployment", function () {
    it("Should have the right name", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("Dram");
    });
    it("Should have the right symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.symbol()).to.equal("AMD");
    });
    it("Should have the right total supply", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.totalSupply()).to.equal("10000000000000000000000");
    });
    it("Should have the right mintable supply", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.mintableSupply()).to.equal("5000000000000000000000");
    });
    it("Should have the right initial supply", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.initialSupply()).to.equal("5000000000000000000000");
    });
    it("Should set the right minter", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.minter()).to.equal(owner.address);
    });
    it("Minter should have the right balance", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.balanceOf(owner.address)).to.equal(
        "5000000000000000000000"
      );
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, owner, caller, otherAccount } = await loadFixture(
        deployTokenFixture
      );
      await expect(token.transfer(caller.address, 100)).to.changeTokenBalances(
        token,
        [owner, caller],
        [-100, 100]
      );

      await expect(
        token.connect(caller).transfer(otherAccount.address, 50)
      ).to.changeTokenBalances(token, [caller, otherAccount], [-50, 50]);
    });
    it("Should emit Transfer events", async function () {
      const { token, owner, caller, otherAccount } = await loadFixture(
        deployTokenFixture
      );
      await expect(token.transfer(caller.address, 100))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, caller.address, 100);

      await expect(token.connect(caller).transfer(otherAccount.address, 50))
        .to.emit(token, "Transfer")
        .withArgs(caller.address, otherAccount.address, 50);
    });
    it("Should fail if the sender doesn't have enough tokens", async function () {
      const { token, owner, caller, otherAccount } = await loadFixture(
        deployTokenFixture
      );

      const initialOwnerBalance = await token.balanceOf(owner.address);
      await expect(
        token.connect(caller).transfer(owner.address, 100)
      ).to.be.revertedWith("Token: not enough funds");
      expect(await token.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });

  describe("Approval", function () {
    it("Should approve", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);
      const approvedAmount = 1000;
      await token.approve(caller.address, approvedAmount);
      expect(await token.allowance(owner.address, caller.address)).to.equal(
        approvedAmount
      );

      await token.approve(caller.address, approvedAmount);
      expect(await token.allowance(owner.address, caller.address)).to.equal(
        approvedAmount * 2
      );
    });
    it("Should emit Approve event", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);

      await expect(token.approve(caller.address, 1000))
        .to.emit(token, "Approve")
        .withArgs(owner.address, caller.address, 1000);
    });
    it("Should fail if the owner doesn't have enough tokens", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);
      const ownerBalance = await token.balanceOf(owner.address);
      await expect(
        token.approve(caller.address, ownerBalance + 1)
      ).to.be.revertedWith("Token: Not enough funds");
    });
  });
  describe("Transactions from", function () {
    it("Should transfer from", async function () {
      const { token, owner, caller, otherAccount } = await loadFixture(
        deployTokenFixture
      );
      await token.approve(caller.address, 1000);
      await expect(
        token
          .connect(caller)
          .transferFrom(owner.address, otherAccount.address, 500)
      ).to.changeTokenBalances(token, [owner, otherAccount], [-500, 500]);
      expect(await token.allowance(owner.address, caller.address)).to.equal(
        "500"
      );
    });
    it("Should revert when not enough allowance", async function () {
      const { token, owner, caller, otherAccount } = await loadFixture(
        deployTokenFixture
      );
      await expect(
        token
          .connect(caller)
          .transferFrom(owner.address, otherAccount.address, 500)
      ).to.be.revertedWith("Token: not enough allowance");
    });
    it("Should revert when owner doesn't have enough funds", async function () {
      const { token, owner, caller, otherAccount } = await loadFixture(
        deployTokenFixture
      );
      await token.approve(caller.address, 100000000);
      const ownerBalance = await token.balanceOf(owner.address);
      await token.transfer(otherAccount.address, ownerBalance);
      await expect(
        token
          .connect(caller)
          .transferFrom(owner.address, otherAccount.address, 10000)
      ).to.be.revertedWith("Token: not enough funds");
    });
    it("Should emit transfer event", async function () {
      const { token, owner, caller, otherAccount } = await loadFixture(
        deployTokenFixture
      );
      await token.approve(caller.address, 1000);
      await expect(
        token
          .connect(caller)
          .transferFrom(owner.address, otherAccount.address, 500)
      )
        .to.emit(token, "Transfer")
        .withArgs(owner.address, otherAccount.address, 500);
    });
  });
  describe("Minting", function () {
    it("Should mint", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);
      const mintableSupply = await token.mintableSupply();
      await token.mint(caller.address, mintableSupply.toString());
      expect(await token.balanceOf(caller.address)).to.equal(
        mintableSupply.toString()
      );
      expect(await token.mintableSupply()).to.equal(0);
    });
    it("Should revert when the caller is not the minter", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);
      await expect(
        token.connect(caller).mint(owner.address, 500)
      ).to.be.revertedWith("Token: Can not mint");
    });
    it("Should revert when the amount is greater when the mintable supply", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);
      const mintableSupply = await token.mintableSupply();
      await expect(
        token.mint(caller.address, mintableSupply.toString() + 1)
      ).to.be.revertedWith("Token: Can not mint");
    });
    it("Should emit Mint event", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);
      await expect(token.mint(caller.address, 500))
        .to.emit(token, "Mint")
        .withArgs(500);
    });
  });
  describe("Burning", function () {
    it("Should burn", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);
      const ownerBalance = await token.balanceOf(owner.address);
      await token.burn(owner.address, ownerBalance.toString());
      expect(await token.balanceOf(owner.address)).to.equal(0);
    });
    it("Should revert when the caller is not the minter", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);
      await expect(
        token.connect(caller).burn(owner.address, 500)
      ).to.be.revertedWith("Not authorised to burn");
    });
    it("Should revert when not enough amount to burn", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);
      await expect(token.burn(caller.address, 500)).to.be.revertedWith(
        "Token: Not enough funds"
      );
    });
    it("Should emit Burn event", async function () {
      const { token, owner, caller } = await loadFixture(deployTokenFixture);
      await expect(token.burn(owner.address, 500))
        .to.emit(token, "Burn")
        .withArgs(500);
    });
  });
});
