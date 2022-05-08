import { TestCtx, deployContract, getAccounts } from "./shared";

import { shouldBehaveLikeMDRTWithRefSpec } from './MDRTWithRefSpec.behavior';

declare module "mocha" {
  export interface Context {
    tc: TestCtx;
  }
}

describe("MDRTWithRefSpecOnly", function () {
  beforeEach(async function () {
    const registryContract = await deployContract("MDRTWithRefSpecOnly");
    const accounts = await getAccounts();

    const tc = {
      registryContract,
      accounts,
    };

    this.tc = tc;
  });

  shouldBehaveLikeMDRTWithRefSpec();

});
