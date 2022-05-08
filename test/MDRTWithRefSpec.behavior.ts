import { TestAccounts, Roles, getConnectedContract, grantRole } from "./shared";

import { prepareTestToken } from "./prepare";

import {
  expectUpdateDataURIForToken,
  expectUpdateDataURIForTokenWithEmit,
  expectUpdateAndGetRefSpec,
  expectDenyRefSpecUpdate,
  expectSeqNum,
  expectUpdateRefSpecWithEmit,
  expectUpdateAndGetDefaultRefSpec,
  expectUpdateAndEmitDefaultRefSpecUpdate,
  expectGetRefSpec,
  expectGetRefSpecUsingDefault,
  expectDenyDefaultRefSpecUpdate,
} from "./MDRT.expects";


function shouldBehaveLikeMDRTWithRefSpec() {
  
  describe("refSpec functions (manager roles)", function () {
    const userRoles = [
      {
        usingAccount: TestAccounts.XMANAGER1,
        roleDescription: "token creator",
        role: Roles.TOKEN_CREATOR,
        tokenCreatingAccount: TestAccounts.XMANAGER1,
      }, // ok
      {
        usingAccount: TestAccounts.TMANAGER1,
        roleDescription: "token manager",
        role: Roles.TOKEN_MANAGER,
        tokenCreatingAccount: TestAccounts.XMANAGER1,
      }, // ok, if token manager
      {
        usingAccount: TestAccounts.OWNER,
        roleDescription: "registry owner",
        role: Roles.REGISTRY_OWNER,
        tokenCreatingAccount: TestAccounts.XMANAGER1,
      }, // ok
      {
        usingAccount: TestAccounts.RMANAGER1,
        roleDescription: "registry manager",
        role: Roles.REGISTRY_MANAGER,
        tokenCreatingAccount: TestAccounts.XMANAGER1,
      }, //ok
      // { usingAccount: TestAccounts.XMANAGER2, roleDescription: 'regular user', role: Roles.NONE, tokenCreatingAccount: TestAccounts.XMANAGER1 }, // fail
    ];

    userRoles.forEach((roleToTest) => {
      context(`when ${roleToTest.roleDescription}`, function () {
        // let ownerConnectedContract: Contract;
        let tokenId: number;

        beforeEach(async function () {
          if (roleToTest.role === Roles.REGISTRY_MANAGER) {
            const ownerConnectedContract = getConnectedContract(this.tc.registryContract, this.tc.accounts, TestAccounts.OWNER);
            grantRole(ownerConnectedContract, this.tc.accounts, roleToTest.usingAccount, Roles.REGISTRY_MANAGER, 0);
          }
          if (roleToTest.role === Roles.TOKEN_MANAGER) {
            tokenId = await prepareTestToken(this.tc, roleToTest.tokenCreatingAccount, roleToTest.usingAccount);
          } else {
            tokenId = await prepareTestToken(this.tc, roleToTest.tokenCreatingAccount);
          }
        });

        // if (roleToTest.role !== Roles.NONE) {

        it("should update and get ref spec", async function () {
          await expectUpdateAndGetRefSpec(this.tc, roleToTest.usingAccount, tokenId);
        });

        it("should update data uri and increment seq num", async function () {
          await expectUpdateDataURIForToken(this.tc, roleToTest.usingAccount, tokenId, "updated Data URI");
          await expectSeqNum(this.tc, roleToTest.usingAccount, tokenId, 2);
        });

        it("should update ref spec and not increment seq num", async function () {
          await expectUpdateDataURIForToken(this.tc, roleToTest.usingAccount, tokenId, "updated Data URI");
          await expectSeqNum(this.tc, roleToTest.usingAccount, tokenId, 2);
          await expectUpdateAndGetRefSpec(this.tc, roleToTest.usingAccount, tokenId);
          await expectSeqNum(this.tc, roleToTest.usingAccount, tokenId, 2); // seqNum not changed
        });

        it("should emit RefSpecUpdate event", async function () {
          await expectUpdateRefSpecWithEmit(this.tc, roleToTest.usingAccount, tokenId);
        });

        it("should emit DataInfoUpdate event with updated seq num", async function () {
          await expectUpdateDataURIForTokenWithEmit(this.tc, roleToTest.usingAccount, tokenId, 2);
        });

        if (roleToTest.role === Roles.REGISTRY_OWNER || roleToTest.role == Roles.REGISTRY_MANAGER) {
          it("should update default ref spec", async function () {
            await expectUpdateAndGetDefaultRefSpec(this.tc, roleToTest.usingAccount, tokenId);
          });

          it("should emit DefaultRefSpecUpdate event", async function () {
            await expectUpdateAndEmitDefaultRefSpecUpdate(this.tc, roleToTest.usingAccount, tokenId);
          });
        }

        // } else {
        //   it("should deny regular user update");
        // }
      });
    });
  });

  describe("refSpec functions (regular user)", function () {
    let tokenId: number;

    beforeEach(async function () {
      tokenId = await prepareTestToken(this.tc, TestAccounts.OWNER);
    });

    it("should allow refSpec lookup", async function () {
      await expectGetRefSpec(this.tc, TestAccounts.XMANAGER2, tokenId);
    });

    it("should allow refSpec lookup (with default refSpec)", async function () {
      await expectGetRefSpecUsingDefault(this.tc, TestAccounts.XMANAGER2, tokenId);
    });

    it("should deny refSpec update", async function () {
      await expectDenyRefSpecUpdate(this.tc, TestAccounts.XMANAGER2, tokenId);
    });

    it("should deny default refSpec update", async function () {
      await expectDenyDefaultRefSpecUpdate(this.tc, TestAccounts.XMANAGER2, tokenId);
    });
  });  
}

export {
  shouldBehaveLikeMDRTWithRefSpec
}