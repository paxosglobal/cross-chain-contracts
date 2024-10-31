const { deployOFTWrapper, LIMIT } = require('./helpers/fixtures');
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { assert, expect } = require('chai');

const CREDIT_AMOUNT = 10000;
const DEBIT_AMOUNT = 3000;
const NEW_LIMIT = ethers.utils.parseEther('900')

describe('OFTWrapper Test', function () {

    beforeEach(async function () {
      Object.assign(this, await loadFixture(deployOFTWrapper));
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

    describe('setRateLimits', function () {
      it('can succesfully call setRateLimits', async function () {
        const newRateLimitConfig = {
          dstEid: 1,
          limit: NEW_LIMIT,
          window: 100
        }
        await this.contract.setRateLimits([newRateLimitConfig])
        const rateLimitConfig = await this.contract.rateLimits(newRateLimitConfig.dstEid);
        assert.equal(rateLimitConfig.limit.toString(), newRateLimitConfig.limit.toString())
        assert.equal(rateLimitConfig.window, newRateLimitConfig.window)
      });

      it('cannot call setRateLimits from non owner', async function () {
        const newRateLimitConfig = {
          dstEid: 1,
          limit: NEW_LIMIT,
          window: 100
        }
        await expect(this.contract.connect(this.admin).setRateLimits([newRateLimitConfig])).to.be.reverted;
      });
    });

    describe('credit', function () {
      it('can succesfully call credit', async function () {
        await this.contract.credit(this.owner.address, CREDIT_AMOUNT, 1);
        let amount = await this.tokenFixture.balanceOf(this.owner.address)
        assert.equal(amount, CREDIT_AMOUNT)
      });
    });

    describe('debit', function () {
      it('can succesfully call debit', async function () {
        await this.contract.credit(this.owner.address, CREDIT_AMOUNT, 1);

        await this.contract.debit(this.owner.address, DEBIT_AMOUNT, 100, 1);
        let amount = await this.tokenFixture.balanceOf(this.owner.address)
        assert.equal(amount, CREDIT_AMOUNT - DEBIT_AMOUNT)
      });

      it('cannot call debit if rate limit exceeded', async function () {
        await this.contract.credit(this.owner.address, NEW_LIMIT + 100, 1);
        await expect(this.contract.debit(this.owner.address, NEW_LIMIT + 100, 100, 1)).to.be.revertedWithCustomError(this.contract, "RateLimitExceeded")
      });

      it('can call debit if rate limit updated to higher amount', async function () {
        await this.contract.credit(this.owner.address, NEW_LIMIT + 100, 1);
        const newRateLimitConfig = {
          dstEid: 1,
          limit: NEW_LIMIT + NEW_LIMIT,
          window: 100
        }
        await this.contract.setRateLimits([newRateLimitConfig])
        await this.contract.debit(this.owner.address, NEW_LIMIT + 100, 100, 1)
        let amount = await this.tokenFixture.balanceOf(this.owner.address)
        assert.equal(amount, 0)
      });
    });

});