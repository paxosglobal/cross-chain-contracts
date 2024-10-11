const { deployOFTWrapper } = require('./helpers/fixtures');
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { assert } = require('chai');

const CREDIT_AMOUNT = 10000;
const DEBIT_AMOUNT = 3000;

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
    });

});