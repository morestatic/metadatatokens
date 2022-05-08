import {
  TestCtx,
  deployContract,
  getAccounts,
} from "./shared";

import { shouldBehaveLikeMDRTCore } from './MDRTCore.behavior';
import { shouldBehaveLikeMDRTWithRunState } from './MDRTWithRunState.behavior';
import { shouldBehaveLikeMDRTWithRefSpec } from './MDRTWithRefSpec.behavior';

declare module "mocha" {
  export interface Context {
    tc: TestCtx;
  }
}

describe("MDRTFull", function () {

  beforeEach(async function () {
    const registryContract = await deployContract('MDRTFull');
    const accounts = await getAccounts();

    const tc = {
      registryContract,
      accounts
    };

    this.tc = tc;
  });

  shouldBehaveLikeMDRTCore();
  shouldBehaveLikeMDRTWithRefSpec();
  shouldBehaveLikeMDRTWithRunState();

});
