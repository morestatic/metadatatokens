import { expect } from "chai";
import { Contract } from "ethers";

import {
  RunningStates,
  ErrorMessages,
  TestAccounts,
  Roles,
  initialDataUri,
  getAccountAddress,
  getConnectedContract,
} from "./shared";

import {
  prepareSingleToken,
} from "./prepare";

function isAdmin(role: Roles): boolean {
  if (role === undefined) return false;
  if (role === Roles.REGISTRY_MANAGER) return true;
  if (role === Roles.REGISTRY_OWNER) return true;
  return false;
}

function shouldBehaveLikeMDRTWithRunState() {

  describe("contract running state tests", function () {

    const userRoles = [
      { usingAccount: TestAccounts.OWNER, description: 'registry owner', grantRole: true, role: Roles.REGISTRY_OWNER, useToken: false },
      { usingAccount: TestAccounts.RMANAGER1, description: 'registry manager', grantRole: true, role: Roles.REGISTRY_MANAGER, useToken: false },
      { usingAccount: TestAccounts.TMANAGER1, description: 'token manager', grantRole: true, role: Roles.TOKEN_MANAGER, useToken: true },
      { usingAccount: TestAccounts.XMANAGER1, description: 'token creator', grantRole: true, role: Roles.TOKEN_CREATOR, useToken: false },
      { usingAccount: TestAccounts.XMANAGER2, description: 'regular user', grantRole: false, role: Roles.NONE, useToken: false }
    ];

    userRoles.forEach(roleToTest => {

      context(`when ${roleToTest.description}`, function () {

        let ownerConnectedContract: Contract;
        let connectedContract: Contract;

        beforeEach(async function () {
          let tokenId = 0;
          ownerConnectedContract = getConnectedContract(this.tc.registryContract, this.tc.accounts, TestAccounts.OWNER);
          if (roleToTest.useToken) {
            tokenId = await prepareSingleToken(this.tc, RunningStates.OK);
          }
          if (roleToTest.grantRole) {
            await ownerConnectedContract.grant(roleToTest.role, getAccountAddress(this.tc.accounts, roleToTest.usingAccount), tokenId);
          }
          connectedContract = getConnectedContract(this.tc.registryContract, this.tc.accounts, roleToTest.usingAccount);
        });

        describe("changing running state", function () {

          if (roleToTest.role === Roles.REGISTRY_OWNER) {
            it("should allow halting of the running state", async function () {
              await expect(connectedContract.setRunningState(RunningStates.HALTED)).not.to.be.reverted;
            });
          } else {
            it("should revert when trying to halt running state", async function () {
              await expect(connectedContract.setRunningState(RunningStates.HALTED)).to.be.revertedWith("must be owner to halt");
            });
          }

          if (isAdmin(roleToTest.role)) {
            it("should allow pausing of the running state", async function () {
              await expect(connectedContract.setRunningState(RunningStates.PAUSED)).not.to.be.reverted;
            });
          } else {
            it("should not allow pausing of the running state", async function () {
              await expect(connectedContract.setRunningState(RunningStates.PAUSED)).to.be.revertedWith("must be registry manager");
            });
          }

          if (isAdmin(roleToTest.role)) {
            it("should allow making the running state read only", async function () {
              await expect(connectedContract.setRunningState(RunningStates.READONLY)).not.to.be.reverted;
            });
          } else {
            it("should not allow pausing of the running state", async function () {
              await expect(connectedContract.setRunningState(RunningStates.READONLY)).to.be.revertedWith("must be registry manager");
            });
          }

        });

        context("when halted", function () {

          beforeEach(async function () {
            await ownerConnectedContract.setRunningState(RunningStates.HALTED);
          });

          it("should revert when trying to change running state", async function () {
            await expect(connectedContract.setRunningState(RunningStates.OK)).to.be.revertedWith(ErrorMessages.HALTED);
          });

          it("should not allow checking of the current run state", async function () {
            await expect(connectedContract.getRunningState()).to.be.revertedWith(ErrorMessages.HALTED);
          });

          it("should not mint token", async function () {
            await expect(connectedContract.mint(initialDataUri)).to.be.revertedWith(ErrorMessages.HALTED);
          });

          it("should not burn token", async function () {
            await expect(connectedContract.burn(1)).to.be.revertedWith(ErrorMessages.HALTED);
          });

          it("should not updateDataURI", async function () {
            await expect(connectedContract.updateDataURI(1, "123123123")).to.be.revertedWith(ErrorMessages.HALTED);
          });

          it("should not get dataURI", async function () {
            await expect(connectedContract.dataURI(1)).to.be.revertedWith(ErrorMessages.HALTED);
          });

          it("should not get tokenURI", async function () {
            await expect(connectedContract.tokenURI(1)).to.be.revertedWith(ErrorMessages.HALTED);
          });

          it("should not allow registry manager admin changes", async function () {
            await expect(connectedContract.grant(Roles.REGISTRY_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.RMANAGER1), 0)).to.be.revertedWith(ErrorMessages.HALTED);
            await expect(connectedContract.revoke(Roles.REGISTRY_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.RMANAGER1), 0)).to.be.revertedWith(ErrorMessages.HALTED);
          });

          it("should not allow token creator admin changes", async function () {
            await expect(connectedContract.grant(Roles.TOKEN_CREATOR, getAccountAddress(this.tc.accounts, TestAccounts.XMANAGER1), 0)).to.be.revertedWith(ErrorMessages.HALTED);
            await expect(connectedContract.revoke(Roles.TOKEN_CREATOR, getAccountAddress(this.tc.accounts, TestAccounts.XMANAGER1), 0)).to.be.revertedWith(ErrorMessages.HALTED);
          });

          it("should not allow token manager admin changes", async function () {
            await expect(connectedContract.grant(Roles.TOKEN_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.TMANAGER1), 1)).to.be.revertedWith(ErrorMessages.HALTED);
            await expect(connectedContract.revoke(Roles.TOKEN_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.TMANAGER1), 1)).to.be.revertedWith(ErrorMessages.HALTED);
          });

        });

        context("when paused", function () {

          beforeEach(async function () {
            await ownerConnectedContract.setRunningState(RunningStates.PAUSED);
          });

          if (isAdmin(roleToTest.role)) {
            it("should allow un-pausing of the running state", async function () {
              await expect(connectedContract.setRunningState(RunningStates.OK)).not.to.be.reverted;
            });
          } else {
            it("should not allow un-pausing of the running state", async function () {
              await expect(connectedContract.setRunningState(RunningStates.OK)).to.be.revertedWith('must be registry manager');
            });
          }

          if (isAdmin(roleToTest.role)) {
            it("should allow checking of the current run state", async function() {
              const currentState = await connectedContract.getRunningState();
              expect(currentState).to.equal(RunningStates.PAUSED);
            });  
          }

          it("should not mint token", async function () {
            await expect(connectedContract.mint(initialDataUri)).to.be.revertedWith(ErrorMessages.PAUSED);
          });

          it("should not burn token", async function () {
            await expect(connectedContract.burn(1)).to.be.revertedWith(ErrorMessages.PAUSED);
          });

          it("should not updateDataURI", async function () {
            await expect(connectedContract.updateDataURI(1, "123123123")).to.be.revertedWith(ErrorMessages.PAUSED);
          });

          it("should not get dataURI", async function () {
            await expect(connectedContract.dataURI(1)).to.be.revertedWith(ErrorMessages.PAUSED);
          });

          it("should not get tokenURI", async function () {
            await expect(connectedContract.tokenURI(1)).to.be.revertedWith(ErrorMessages.PAUSED);
          });

          it("should not allow registry manager admin changes", async function () {
            await expect(connectedContract.grant(Roles.REGISTRY_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.RMANAGER1), 0)).to.be.revertedWith(ErrorMessages.PAUSED);
            await expect(connectedContract.revoke(Roles.REGISTRY_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.RMANAGER1), 0)).to.be.revertedWith(ErrorMessages.PAUSED);
          });

          it("should not allow token creator admin changes", async function () {
            await expect(connectedContract.grant(Roles.TOKEN_CREATOR, getAccountAddress(this.tc.accounts, TestAccounts.XMANAGER1), 0)).to.be.revertedWith(ErrorMessages.PAUSED);
            await expect(connectedContract.revoke(Roles.TOKEN_CREATOR, getAccountAddress(this.tc.accounts, TestAccounts.XMANAGER1), 0)).to.be.revertedWith(ErrorMessages.PAUSED);
          });

          it("should not allow token manager admin changes", async function () {
            await expect(connectedContract.grant(Roles.TOKEN_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.TMANAGER1), 1)).to.be.revertedWith(ErrorMessages.PAUSED);
            await expect(connectedContract.revoke(Roles.TOKEN_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.TMANAGER1), 1)).to.be.revertedWith(ErrorMessages.PAUSED);
          });

        });

        context("when read only", function () {

          beforeEach(async function () {
            await ownerConnectedContract.setRunningState(RunningStates.READONLY);
          });

          if (isAdmin(roleToTest.role)) {
            it("should allow making the running state ok again", async function () {
              await expect(connectedContract.setRunningState(RunningStates.OK)).not.to.be.reverted;
            });
          } else {
            it("should not allow making the running state ok again", async function () {
              await expect(connectedContract.setRunningState(RunningStates.OK)).to.be.revertedWith('must be registry manager');
            });
          }

          it("should allow checking of the current run state");

          it("should not mint token", async function () {
            await expect(connectedContract.mint(initialDataUri)).to.be.revertedWith(ErrorMessages.READONLY);
          });

          it("should not burn token", async function () {
            await expect(connectedContract.burn(1)).to.be.revertedWith(ErrorMessages.READONLY);
          });

          it("should not updateDataURI", async function () {
            await expect(connectedContract.updateDataURI(1, "123123123")).to.be.revertedWith(ErrorMessages.READONLY);
          });

          it("should get dataURI", async function () {
            const tokenId = await prepareSingleToken(this.tc, RunningStates.READONLY);
            await expect(connectedContract.dataURI(tokenId)).not.to.be.reverted;
          });

          it("should get tokenURI", async function () {
            const tokenId = await prepareSingleToken(this.tc, RunningStates.READONLY);
            await expect(connectedContract.tokenURI(tokenId)).not.to.be.reverted;
          });

          it("should not allow registry manager admin changes", async function () {
            await expect(connectedContract.grant(Roles.REGISTRY_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.RMANAGER1), 0)).to.be.revertedWith(ErrorMessages.READONLY);
            await expect(connectedContract.revoke(Roles.REGISTRY_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.RMANAGER1), 0)).to.be.revertedWith(ErrorMessages.READONLY);
          });

          it("should not allow token creator admin changes", async function () {
            await expect(connectedContract.grant(Roles.TOKEN_CREATOR, getAccountAddress(this.tc.accounts, TestAccounts.XMANAGER1), 0)).to.be.revertedWith(ErrorMessages.READONLY);
            await expect(connectedContract.revoke(Roles.TOKEN_CREATOR, getAccountAddress(this.tc.accounts, TestAccounts.XMANAGER1), 0)).to.be.revertedWith(ErrorMessages.READONLY);
          });

          it("should not allow token manager admin changes", async function () {
            await expect(connectedContract.grant(Roles.TOKEN_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.TMANAGER1), 1)).to.be.revertedWith(ErrorMessages.READONLY);
            await expect(connectedContract.revoke(Roles.TOKEN_MANAGER, getAccountAddress(this.tc.accounts, TestAccounts.TMANAGER1), 1)).to.be.revertedWith(ErrorMessages.READONLY);
          });

        });

      });

    });

  });

}


export {
  shouldBehaveLikeMDRTWithRunState
}