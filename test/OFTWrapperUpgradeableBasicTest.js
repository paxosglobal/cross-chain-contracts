const { deployOFTWrapperUpgradeable, LIMIT, INBOUND_LIMIT } = require('./helpers/upgradeableFixtures');
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { assert, expect } = require('chai');
const { ethers, upgrades } = require("hardhat");

const CREDIT_AMOUNT = 10000;
const DEBIT_AMOUNT = 3000;
const NEW_LIMIT = ethers.utils.parseEther('900')
const NEW_INBOUND_LIMIT = ethers.utils.parseEther('400')

describe('OFTWrapperUpgradeable Test', function () {

    beforeEach(async function () {
      Object.assign(this, await loadFixture(deployOFTWrapperUpgradeable));
    });

    describe('oftVersion', function () {
      it('can get oftVersion', async function () {
        let res = await this.contract.oftVersion();
        assert.equal(res.version, 1)
      });
    });

    describe('decimalConversionRate', function () {
      it('can get decimal conversion rate', async function () {
        let res = await this.contract.decimalConversionRate();
        assert.equal(res, 1)
      });
    });

    describe('token', function () {
      it('can get token address', async function () {
        let res = await this.contract.token();
        assert.equal(res, this.tokenFixture.address)
      });
    });

    describe('approvalRequired', function () {
      it('check approvalRequired', async function () {
        let res = await this.contract.approvalRequired();
        assert.isFalse(res)
      });
    });

    describe('ownership', function () {
      it('owner is set correctly via initialize', async function () {
        const owner = await this.contract.owner();
        assert.equal(owner, this.owner.address);
      });

      it('can transfer ownership', async function () {
        await this.contract.transferOwnership(this.admin.address);
        const newOwner = await this.contract.owner();
        assert.equal(newOwner, this.admin.address);
      });

      it('non-owner cannot transfer ownership', async function () {
        await expect(
          this.contract.connect(this.admin).transferOwnership(this.acc.address)
        ).to.be.reverted;
      });
    });

    describe('setOutboundRateLimits (outbound)', function () {
      it('can successfully call setOutboundRateLimits', async function () {
        const newRateLimitConfig = {
          dstEid: 1,
          limit: NEW_LIMIT,
          window: 100
        }
        await this.contract.setOutboundRateLimits([newRateLimitConfig])
        const rateLimitConfig = await this.contract.rateLimits(newRateLimitConfig.dstEid);
        assert.equal(rateLimitConfig.limit.toString(), newRateLimitConfig.limit.toString())
        assert.equal(rateLimitConfig.window, newRateLimitConfig.window)
      });

      it('cannot call setOutboundRateLimits from non owner', async function () {
        const newRateLimitConfig = {
          dstEid: 1,
          limit: NEW_LIMIT,
          window: 100
        }
        await expect(this.contract.connect(this.admin).setOutboundRateLimits([newRateLimitConfig])).to.be.reverted;
      });
    });

    describe('setInboundRateLimits', function () {
      it('can successfully call setInboundRateLimits', async function () {
        const newInboundRateLimitConfig = {
          dstEid: 2,
          limit: NEW_INBOUND_LIMIT,
          window: 200
        }
        await this.contract.setInboundRateLimits([newInboundRateLimitConfig])
        const rateLimitConfig = await this.contract.inboundRateLimits(newInboundRateLimitConfig.dstEid);
        assert.equal(rateLimitConfig.limit.toString(), newInboundRateLimitConfig.limit.toString())
        assert.equal(rateLimitConfig.window, newInboundRateLimitConfig.window)
      });

      it('cannot call setInboundRateLimits from non owner', async function () {
        const newInboundRateLimitConfig = {
          dstEid: 2,
          limit: NEW_INBOUND_LIMIT,
          window: 200
        }
        await expect(this.contract.connect(this.admin).setInboundRateLimits([newInboundRateLimitConfig])).to.be.reverted;
      });

      it('can get amount that can be received', async function () {
        const [currentInFlight, amountCanBeReceived] = await this.contract.getAmountCanBeReceived(1);
        assert.equal(amountCanBeReceived.toString(), INBOUND_LIMIT.toString());
      });
    });

    describe('credit', function () {
      it('can successfully call credit', async function () {
        await this.contract.credit(this.owner.address, CREDIT_AMOUNT, 1);
        let amount = await this.tokenFixture.balanceOf(this.owner.address)
        assert.equal(amount, CREDIT_AMOUNT)
      });

      it('cannot call credit if inbound rate limit exceeded', async function () {
        // Try to credit more than the inbound limit
        const exceedingAmount = INBOUND_LIMIT.add(100);
        await expect(
          this.contract.credit(this.owner.address, exceedingAmount, 1)
        ).to.be.revertedWithCustomError(this.contract, "RateLimitExceeded");
      });

      it('cannot call credit from unconfigured source (blocked by default)', async function () {
        // srcEid 99 is not configured, so limit is 0 (blocked by default)
        await expect(
          this.contract.credit(this.owner.address, 1, 99)
        ).to.be.revertedWithCustomError(this.contract, "RateLimitExceeded");
      });

      it('can call credit if inbound rate limit is updated to higher amount', async function () {
        const initialAmount = INBOUND_LIMIT.sub(100);
        await this.contract.credit(this.owner.address, initialAmount, 1);

        // Update limit to allow more
        const newInboundRateLimitConfig = {
          dstEid: 1,
          limit: INBOUND_LIMIT.add(INBOUND_LIMIT),
          window: 100
        }
        await this.contract.setInboundRateLimits([newInboundRateLimitConfig]);

        // Now should be able to credit more
        await this.contract.credit(this.owner.address, initialAmount, 1);
        let amount = await this.tokenFixture.balanceOf(this.owner.address);
        assert.equal(amount.toString(), initialAmount.mul(2).toString());
      });
    });

    describe('debit', function () {
      it('can successfully call debit', async function () {
        await this.contract.credit(this.owner.address, CREDIT_AMOUNT, 1);

        await this.contract.debit(this.owner.address, DEBIT_AMOUNT, 100, 1);
        let amount = await this.tokenFixture.balanceOf(this.owner.address)
        assert.equal(amount, CREDIT_AMOUNT - DEBIT_AMOUNT)
      });

      it('cannot call debit if rate limit exceeded', async function () {
        // Amount that exceeds the outbound rate limit (LIMIT = 1000 ETH)
        const exceedingAmount = LIMIT.add(100);

        // First increase the inbound limit to allow the credit
        const highInboundLimit = {
          dstEid: 1,
          limit: exceedingAmount.add(exceedingAmount),
          window: 100
        }
        await this.contract.setInboundRateLimits([highInboundLimit]);

        await this.contract.credit(this.owner.address, exceedingAmount, 1);
        await expect(this.contract.debit(this.owner.address, exceedingAmount, 100, 1)).to.be.revertedWithCustomError(this.contract, "RateLimitExceeded")
      });

      it('can call debit if rate limit updated to higher amount', async function () {
        // First increase the inbound limit to allow the credit
        const highInboundLimit = {
          dstEid: 1,
          limit: NEW_LIMIT.add(NEW_LIMIT),
          window: 100
        }
        await this.contract.setInboundRateLimits([highInboundLimit]);

        await this.contract.credit(this.owner.address, NEW_LIMIT.add(100), 1);
        const newRateLimitConfig = {
          dstEid: 1,
          limit: NEW_LIMIT.add(NEW_LIMIT),
          window: 100
        }
        await this.contract.setOutboundRateLimits([newRateLimitConfig])
        await this.contract.debit(this.owner.address, NEW_LIMIT.add(100), 100, 1)
        let amount = await this.tokenFixture.balanceOf(this.owner.address)
        assert.equal(amount, 0)
      });
    });

    describe('upgrade', function () {
      it('owner can upgrade the contract', async function () {
        // Get current implementation address
        const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
        const implementationBefore = await ethers.provider.getStorageAt(this.contract.address, implementationSlot);

        // Deploy a new implementation and upgrade
        const OFTWrapperUpgradeableFixture = await ethers.getContractFactory("OFTWrapperUpgradeableFixture");
        const tokenDecimals = await this.tokenFixture.decimals();

        const upgraded = await upgrades.upgradeProxy(
          this.contract.address,
          OFTWrapperUpgradeableFixture,
          {
            constructorArgs: [tokenDecimals, this.lzEndpoint.address, this.tokenFixture.address],
            unsafeAllow: ['constructor', 'state-variable-immutable', 'missing-initializer-call', 'missing-initializer']
          }
        );

        // Verify the upgrade happened (implementation address changed)
        const implementationAfter = await ethers.provider.getStorageAt(this.contract.address, implementationSlot);

        // State should be preserved
        const owner = await upgraded.owner();
        assert.equal(owner, this.owner.address);

        const tokenAddress = await upgraded.token();
        assert.equal(tokenAddress, this.tokenFixture.address);
      });

      it('non-owner cannot upgrade the contract', async function () {
        const OFTWrapperUpgradeableFixture = await ethers.getContractFactory("OFTWrapperUpgradeableFixture", this.admin);
        const tokenDecimals = await this.tokenFixture.decimals();

        await expect(
          upgrades.upgradeProxy(
            this.contract.address,
            OFTWrapperUpgradeableFixture,
            {
              constructorArgs: [tokenDecimals, this.lzEndpoint.address, this.tokenFixture.address],
              unsafeAllow: ['constructor', 'state-variable-immutable', 'missing-initializer-call', 'missing-initializer']
            }
          )
        ).to.be.reverted;
      });
    });

    describe('frozen address handling', function () {
      it('credit reverts when destination address is frozen', async function () {
        await this.tokenFixture.setFrozen(this.recipient.address, true);
        await expect(
          this.contract.credit(this.recipient.address, CREDIT_AMOUNT, 1)
        ).to.be.revertedWith("mintToAddress frozen");
      });

      it('credit succeeds after address is unfrozen', async function () {
        await this.tokenFixture.setFrozen(this.recipient.address, true);
        await expect(
          this.contract.credit(this.recipient.address, CREDIT_AMOUNT, 1)
        ).to.be.revertedWith("mintToAddress frozen");

        await this.tokenFixture.setFrozen(this.recipient.address, false);
        await this.contract.credit(this.recipient.address, CREDIT_AMOUNT, 1);
        const balance = await this.tokenFixture.balanceOf(this.recipient.address);
        assert.equal(balance, CREDIT_AMOUNT);
      });

      it('debit reverts when sender address is frozen', async function () {
        // Credit tokens first
        await this.contract.credit(this.owner.address, CREDIT_AMOUNT, 1);

        // Freeze the sender
        await this.tokenFixture.setFrozen(this.owner.address, true);
        await expect(
          this.contract.debit(this.owner.address, DEBIT_AMOUNT, 0, 1)
        ).to.be.revertedWith("burnFromAddress frozen");
      });
    });

    describe('initialization', function () {
      it('cannot initialize twice', async function () {
        await expect(
          this.contract.initialize(
            this.acc2.address,
            this.owner.address
          )
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });
    });

});
