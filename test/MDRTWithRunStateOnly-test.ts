import {
  TestCtx,
  deployContract,
  getAccounts,
} from "./shared";

import {
  shouldBehaveLikeMDRTWithRunState
} from './MDRTWithRunState.behavior';

declare module "mocha" {
  export interface Context {
    tc: TestCtx;
  }
}

describe("MDRTWithRunState", function () {

  beforeEach(async function () {
    const registryContract = await deployContract('MDRTWithRunStateOnly');
    const accounts = await getAccounts();

    const tc = {
      registryContract,
      accounts
    };

    this.tc = tc;
  });

  shouldBehaveLikeMDRTWithRunState();

});
