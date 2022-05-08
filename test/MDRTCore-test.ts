import {
  TestCtx,
  deployContract,
  getAccounts,
} from "./shared";

import {
  shouldBehaveLikeMDRTCore,
} from './MDRTCore.behavior';

declare module "mocha" {
  export interface Context {
    tc: TestCtx;
  }
}


describe("MDRTCore", function () {

  beforeEach(async function () {
    const registryContract = await deployContract("MDRTCore");
    const accounts = await getAccounts();

    const tc = {
      registryContract,
      accounts,
    };

    this.tc = tc;
  });

  shouldBehaveLikeMDRTCore();

});

