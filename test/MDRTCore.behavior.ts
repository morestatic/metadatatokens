import { expect } from "chai";
import { Contract } from "ethers";

import {
  Roles,
  TestAccounts,
  initialDataUri,
  waitForTx,
  getTokenIdFromTx,
  getAccountAddress,
  mintToken,
  getConnectedContract,
  grantRole,
} from "./shared";

import {
  expectMintToken,
  expectFailMintTokenWhenTokenManager,
  expectBurnToken,
  expectBurnTokenById,
  expectBurnTokenWithEmit,
  expectBurnFailWhenNonExistentToken,
  expectBurnFailWhenTokenManager,
  expectBurnFailTokenById,
  expectGetDataURI,
  expectGetTokenURI,
  expectUpdateDataURI,
  expectUpdateDataURIForToken,
  expectSetTokenURIForToken,
  expectDenyUpdateDataURIForToken,
  expectUpdateDataURIWithEmit,
  expectGrantRole,
  expectGrantRoleWithEmit,
  expectRevokeRole,
  expectRevokeRoleWithEmit,
  expectDenyGrantRole,
  expectDenyRevokeRole,
  expectNoPermissionWhenUnknownRole,
  expectNoMembersForUnknownRole,
  expectGetManagerList,
  expectDenyGetManagerList,
  expectRevertWhenManagerAtForUnknownRole
} from "./MDRT.expects";

function shouldBehaveLikeMDRTCore() {
  describe("core functions", function () {
    beforeEach(async function () {
      const ownerConnectedContract = getConnectedContract(
        this.tc.registryContract,
        this.tc.accounts,
        TestAccounts.OWNER
      );
      await grantRole(
        ownerConnectedContract,
        this.tc.accounts,
        TestAccounts.XMANAGER1,
        Roles.TOKEN_CREATOR
      );
    });

    context("mint (as token creator)", function () {
      it("should be able to mint tokens (with transfer event)", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1);
      });

      it("should error on empty metadata uri", async function () {
        const connectedContract = getConnectedContract(
          this.tc.registryContract,
          this.tc.accounts,
          TestAccounts.XMANAGER1
        );
        await expect(connectedContract.mint("")).to.be.revertedWith(
          "data URI must not be empty"
        );
      });

      it("should mint multiple tokens with consecutive token ids", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 2);
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 3);
      });

      it("should initially have no token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);

        const connectedContract = getConnectedContract(
          this.tc.registryContract,
          this.tc.accounts,
          TestAccounts.XMANAGER1
        );
        const numManagers = await connectedContract.roleCount(Roles.TOKEN_MANAGER, 1);
        expect(numManagers).to.equal(0);
      });

      it("should add token manager", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);

        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
      });

      it("should emit when adding token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectGrantRoleWithEmit(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1
        );
      });

      it("should remove token manager", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);

        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER2,
          Roles.TOKEN_MANAGER,
          1,
          2
        );

        await expectRevokeRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
      });

      it("should emit when removing token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);

        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectRevokeRoleWithEmit(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1
        );
      });
    });

    context("burn (as token creator)", function () {
      it("should burn own token", async function () {
        await expectBurnToken(this.tc, TestAccounts.XMANAGER1);
      });

      it("should not burn someone else's token", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectBurnFailTokenById(this.tc, TestAccounts.XMANAGER1, 1);
      });

      it("should emit burning transfer event", async function () {
        await expectBurnTokenWithEmit(this.tc, TestAccounts.XMANAGER1);
      });

      it("should error if token not found", async function () {
        await expectBurnFailWhenNonExistentToken(this.tc, TestAccounts.XMANAGER1);
      });

      it("should remove any token managers", async function () {
        const ownerConnectedContract = getConnectedContract(
          this.tc.registryContract,
          this.tc.accounts,
          TestAccounts.OWNER
        );
        const tokenId = await mintToken(ownerConnectedContract);

        await ownerConnectedContract.grant(
          Roles.TOKEN_MANAGER,
          getAccountAddress(this.tc.accounts, TestAccounts.TMANAGER1),
          tokenId
        );

        const updateTx = await ownerConnectedContract.burn(tokenId);
        await waitForTx(updateTx);

        const tokenManagerCount = await ownerConnectedContract.getTokenManagerCountForOwner(
          tokenId
        );
        expect(tokenManagerCount).to.equal(0);
      });
    });

    context("get tokenURI / dataURI (as token creator)", function () {
      it("should be able to get dataURI", async function () {
        await expectGetDataURI(this.tc, TestAccounts.XMANAGER1);
      });

      it("should be able to get tokenURI", async function () {
        await expectGetTokenURI(this.tc, TestAccounts.XMANAGER1);
      });
    });

    context("updateDataURI (as token creator)", function () {
      it("should be able to updateDataURI", async function () {
        await expectUpdateDataURI(this.tc, TestAccounts.XMANAGER1);
      });

      it("should emit data uri update event via updateDataURI", async function () {
        await expectUpdateDataURIWithEmit(this.tc, TestAccounts.XMANAGER1);
      });

      it("should update data uri on more than one token", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 2);
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 3);

        await expectUpdateDataURIForToken(this.tc, TestAccounts.XMANAGER1, 1, "test 1");
        await expectUpdateDataURIForToken(this.tc, TestAccounts.XMANAGER1, 2, "test 1");
        await expectUpdateDataURIForToken(this.tc, TestAccounts.XMANAGER1, 3, "test 1");
      });

      it("should not updateDataURI for someone else's token", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectDenyUpdateDataURIForToken(this.tc, TestAccounts.XMANAGER1, 1, "test 2");
      });

      it("should updateDataURI via setTokenURI", async function() {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectSetTokenURIForToken(this.tc, TestAccounts.XMANAGER1, 1, "test 1");
      });
    });
  });

  describe("permissions", function () {
    context("as a registry owner", function () {
      it("should mint token", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER);
      });

      it("should burn token", async function () {
        await expectBurnToken(this.tc, TestAccounts.OWNER);
      });

      it("should burn someone else's token", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          1
        );
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectBurnTokenById(this.tc, TestAccounts.RMANAGER1, 1);
      });

      it("should get dataURI", async function () {
        await expectGetDataURI(this.tc, TestAccounts.OWNER);
      });

      it("should get tokenURI", async function () {
        await expectGetTokenURI(this.tc, TestAccounts.OWNER);
      });

      it("should updateDataURI", async function () {
        await expectUpdateDataURI(this.tc, TestAccounts.OWNER);
      });

      it("should updateDataURI for someone else's token", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          1
        );
        await expectMintToken(this.tc, TestAccounts.RMANAGER1, 1);
        await expectUpdateDataURIForToken(this.tc, TestAccounts.OWNER, 1, "test 2");
      });

      it("should add new registry managers", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          1
        );
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER2,
          Roles.REGISTRY_MANAGER,
          0,
          2
        );
      });

      it("should emit when new registry managers", async function () {
        await expectGrantRoleWithEmit(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0
        );
        await expectGrantRoleWithEmit(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER2,
          Roles.REGISTRY_MANAGER,
          0
        );
      });

      it("should remove registry managers", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          1
        );
        await expectRevokeRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          0
        );
      });

      it("should list registry managers", async function () {
        const managers = [
          TestAccounts.RMANAGER1,
          TestAccounts.RMANAGER2,
        ]
        await expectGetManagerList(this.tc, Roles.REGISTRY_MANAGER, TestAccounts.OWNER, managers);
      });

      it("should emit when removing registry managers", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          1
        );
        await expectRevokeRoleWithEmit(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER2,
          Roles.REGISTRY_MANAGER,
          0
        );
      });

      it("should add new token creators", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR,
          0,
          1
        );
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.XMANAGER2,
          Roles.TOKEN_CREATOR,
          0,
          2
        );
      });

      it("should remove token creators", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR,
          0,
          1
        );
        await expectRevokeRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR,
          0,
          0
        );
      });

      it("should add new token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.TMANAGER2,
          Roles.TOKEN_MANAGER,
          1,
          2
        );
      });

      it("should remove token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectRevokeRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          0
        );
      });

      it("should list token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        const managers = [
          TestAccounts.TMANAGER1,
          TestAccounts.TMANAGER2,
        ]
        await expectGetManagerList(this.tc, Roles.TOKEN_MANAGER, TestAccounts.OWNER, managers, 1);
      });

      it("should confirm no permission when unknown role", async function() {
        await expectNoPermissionWhenUnknownRole(this.tc, TestAccounts.OWNER, TestAccounts.RMANAGER1, Roles.NONE, 0);
      });

      it("should be no members for unknown role", async function() {
        await expectNoMembersForUnknownRole(this.tc, TestAccounts.OWNER, Roles.NONE, 0);
      });

      it("should return zero address when unknown role when querying manager membership", async function() {
        await expectRevertWhenManagerAtForUnknownRole(this.tc, TestAccounts.OWNER, Roles.NONE, 0);
      });
    });

    context("as a registry manager", function () {
      beforeEach(async function () {
        const ownerConnectedContract = getConnectedContract(
          this.tc.registryContract,
          this.tc.accounts,
          TestAccounts.OWNER
        );
        await grantRole(
          ownerConnectedContract,
          this.tc.accounts,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER
        );
      });

      it("should mint token", async function () {
        await expectMintToken(this.tc, TestAccounts.RMANAGER1);
      });

      it("should burn token", async function () {
        await expectBurnToken(this.tc, TestAccounts.RMANAGER1);
      });

      it("should burn someone else's token", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectBurnTokenById(this.tc, TestAccounts.RMANAGER1, 1);
      });

      it("should get dataURI", async function () {
        await expectGetDataURI(this.tc, TestAccounts.RMANAGER1);
      });

      it("should get tokenURI", async function () {
        await expectGetTokenURI(this.tc, TestAccounts.RMANAGER1);
      });

      it("should updateDataURI", async function () {
        await expectUpdateDataURI(this.tc, TestAccounts.RMANAGER1);
      });

      it("should updateDataURI for someone else's token", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          1
        );
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectUpdateDataURIForToken(this.tc, TestAccounts.RMANAGER1, 1, "test 2");
      });

      it("should add new registry managers", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.RMANAGER2,
          Roles.REGISTRY_MANAGER,
          0,
          2
        );
      });

      it("should remove registry managers", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.RMANAGER2,
          Roles.REGISTRY_MANAGER,
          1,
          2
        );
        await expectRevokeRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.RMANAGER2,
          Roles.REGISTRY_MANAGER,
          1,
          1
        );
      });

      it("should list registry  managers", async function () {
        const managers = [
          TestAccounts.RMANAGER1,
          TestAccounts.RMANAGER2,
        ]
        await expectGetManagerList(this.tc, Roles.REGISTRY_MANAGER, TestAccounts.RMANAGER1, managers);
      });

      it("should add new token creators", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR,
          0,
          1
        );
        await expectGrantRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.XMANAGER2,
          Roles.TOKEN_CREATOR,
          0,
          2
        );
      });

      it("should remove token creators", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR,
          1,
          1
        );
        await expectRevokeRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR,
          1,
          0
        );
      });

      it("should add new token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.RMANAGER1, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectGrantRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.TMANAGER2,
          Roles.TOKEN_MANAGER,
          1,
          2
        );
      });

      it("should remove token managers", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR,
          1,
          1
        );
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectRevokeRole(
          this.tc,
          TestAccounts.RMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          0
        );
      });

      it("should list token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        const managers = [
          TestAccounts.TMANAGER1,
          TestAccounts.TMANAGER2,
        ]
        await expectGetManagerList(this.tc, Roles.TOKEN_MANAGER, TestAccounts.RMANAGER1, managers, 1);
      });
    });

    context("as a token creator", function () {
      beforeEach(async function () {
        const ownerConnectedContract = getConnectedContract(
          this.tc.registryContract,
          this.tc.accounts,
          TestAccounts.OWNER
        );
        await grantRole(
          ownerConnectedContract,
          this.tc.accounts,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR
        );
      });

      it("should mint token", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1);
      });

      it("should burn token", async function () {
        await expectBurnToken(this.tc, TestAccounts.XMANAGER1);
      });

      it("should not burn someone else's tokens", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectBurnFailTokenById(this.tc, TestAccounts.XMANAGER1, 1);
      });

      it("should get dataURI", async function () {
        await expectGetDataURI(this.tc, TestAccounts.XMANAGER1);
      });

      it("should get tokenURI", async function () {
        await expectGetTokenURI(this.tc, TestAccounts.XMANAGER1);
      });

      it("should updateDataURI", async function () {
        await expectUpdateDataURI(this.tc, TestAccounts.XMANAGER1);
      });

      it("should not updateDataURI for someone else's token", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectDenyUpdateDataURIForToken(this.tc, TestAccounts.XMANAGER1, 1, "test 2");
      });

      it("should not add new token creators", async function () {
        await expectDenyGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.XMANAGER2,
          Roles.TOKEN_CREATOR,
          0,
          "must be registry manager"
        );
      });

      it("should add new token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER2,
          Roles.TOKEN_MANAGER,
          1,
          2
        );
      });

      it("should remove token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER2,
          Roles.TOKEN_MANAGER,
          1,
          2
        );
        await expectRevokeRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER2,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
      });

      it("should list token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        const managers = [
          TestAccounts.TMANAGER1,
          TestAccounts.TMANAGER2,
        ];
        await expectGetManagerList(this.tc, Roles.TOKEN_MANAGER, TestAccounts.XMANAGER1, managers, 1);
      });

      it("should not add new registry managers", async function () {
        await expectDenyGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          "must be registry manager"
        );
      });

      it("should not remove registry managers", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          1,
          1
        );
        await expectDenyRevokeRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          "must be registry manager"
        );
      });

      it("should not list registry managers", async function () {
        const managers = [
          TestAccounts.RMANAGER1,
          TestAccounts.RMANAGER2,
        ];
        await expectDenyGetManagerList(this.tc, Roles.REGISTRY_MANAGER, TestAccounts.OWNER, TestAccounts.XMANAGER1, managers);
      });
    });

    context("as a token manager", function () {
      beforeEach(async function () {
        const ownerConnectedContract = getConnectedContract(
          this.tc.registryContract,
          this.tc.accounts,
          TestAccounts.OWNER
        );
        await grantRole(
          ownerConnectedContract,
          this.tc.accounts,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR
        );
      });

      it("should not mint tokens", async function () {
        await expectFailMintTokenWhenTokenManager(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1
        );
      });

      it("should not burn tokens", async function () {
        await expectBurnFailWhenTokenManager(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1
        );
      });

      it("should get dataURI", async function () {
        await expectGetDataURI(this.tc, TestAccounts.XMANAGER1, TestAccounts.TMANAGER1);
      });

      it("should get tokenURI", async function () {
        await expectGetTokenURI(this.tc, TestAccounts.XMANAGER1, TestAccounts.TMANAGER1);
      });

      it("should updateDataURI", async function () {
        await expectUpdateDataURI(this.tc, TestAccounts.XMANAGER1, TestAccounts.TMANAGER1);
      });

      it("should not updateDataURI for someone else's token", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectDenyUpdateDataURIForToken(this.tc, TestAccounts.XMANAGER1, 1, "test 2");
      });

      it("should not add new registry managers", async function () {
        await expectDenyGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          1,
          "must be registry manager"
        );
      });

      it("should not remove registry managers", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          1,
          1
        );
        await expectDenyRevokeRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          "must be registry manager"
        );
      });

      it("should not list registry managers", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        const managers = [
          TestAccounts.RMANAGER1,
          TestAccounts.RMANAGER2,
        ];
        await expectDenyGetManagerList(this.tc, Roles.REGISTRY_MANAGER, TestAccounts.OWNER, TestAccounts.TMANAGER1, managers);
      });

      it("should not add new token creators", async function () {
        await expectDenyGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.XMANAGER2,
          Roles.TOKEN_CREATOR,
          0,
          "must be registry manager"
        );
      });

      it("should not remove token creators", async function () {
        await expectDenyRevokeRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.XMANAGER2,
          Roles.TOKEN_CREATOR,
          0,
          "must be registry manager"
        );
      });

      it("should add new token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectGrantRole(
          this.tc,
          TestAccounts.TMANAGER1,
          TestAccounts.TMANAGER2,
          Roles.TOKEN_MANAGER,
          1,
          2
        );
      });

      it("should remove token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER2,
          Roles.TOKEN_MANAGER,
          1,
          2
        );
        await expectRevokeRole(
          this.tc,
          TestAccounts.TMANAGER1,
          TestAccounts.TMANAGER2,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
      });

      it("should list token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.XMANAGER1, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.TMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        const managers = [
          TestAccounts.TMANAGER1,
          TestAccounts.TMANAGER2,
        ]
        await expectGetManagerList(this.tc, Roles.TOKEN_MANAGER, TestAccounts.TMANAGER1, managers, 1);
      });

      it("should check token manager roles");

      it("should be denied when checking non token manager roles")
    });

    context("as user with no authority", function () {
      let otherConnectedContract: Contract;

      beforeEach(async function () {
        otherConnectedContract = getConnectedContract(
          this.tc.registryContract,
          this.tc.accounts,
          TestAccounts.XMANAGER2
        );
      });

      it("should not be able to mint tokens", async function () {
        await expect(otherConnectedContract.mint(initialDataUri)).to.be.revertedWith(
          "must be creator"
        );
      });

      it("should not be able to burn tokens", async function () {
        const ownerConnectedContract = getConnectedContract(
          this.tc.registryContract,
          this.tc.accounts,
          TestAccounts.OWNER
        );
        const tokenId = await mintToken(ownerConnectedContract);

        await expect(otherConnectedContract.burn(tokenId)).to.be.revertedWith(
          "must be owner or registry manager"
        );
      });

      it(`should get data uri for minted token`, async function () {
        const tx = await this.tc.registryContract.mint(initialDataUri);
        const tokenId = await getTokenIdFromTx(tx);

        const dataURI = await otherConnectedContract.dataURI(tokenId);
        expect(dataURI, `unexpected dataURI ${dataURI}`).to.equal(initialDataUri);
      });

      it(`should get data uri for minted token`, async function () {
        const tx = await this.tc.registryContract.mint(initialDataUri);
        const tokenId = await getTokenIdFromTx(tx);

        const tokenURI = await otherConnectedContract.tokenURI(tokenId);
        expect(tokenURI, `unexpected tokenURI ${tokenURI}`).to.equal(initialDataUri);
      });

      it(`should error when anyone tries to get data uri for burnt token`, async function () {
        const tx = await this.tc.registryContract.mint(initialDataUri);
        const tokenId = await getTokenIdFromTx(tx);

        // TODO: update to connect contract to otherwise unused account
        const burnTx = await this.tc.registryContract.burn(tokenId);
        await waitForTx(burnTx);

        await expect(otherConnectedContract.dataURI(tokenId)).to.be.revertedWith(
          "ERC721URIStorage: URI query for nonexistent token"
        );
      });

      it("should not add registry managers", async function () {
        await expectDenyGrantRole(
          this.tc,
          TestAccounts.XMANAGER2,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          "must be registry manager"
        );
      });

      it("should not remove registry managers", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          1
        );
        await expectDenyRevokeRole(
          this.tc,
          TestAccounts.XMANAGER1,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER,
          0,
          "must be registry manager"
        );
      });

      it("should not list registry managers", async function () {
        const managers = [
          TestAccounts.RMANAGER1,
          TestAccounts.RMANAGER2,
        ];
        await expectDenyGetManagerList(this.tc, Roles.REGISTRY_MANAGER, TestAccounts.OWNER, TestAccounts.XMANAGER2, managers);
      });

      it("should not add token creators", async function () {
        await expectDenyGrantRole(
          this.tc,
          TestAccounts.XMANAGER2,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR,
          0,
          "must be registry manager"
        );
      });

      it("should not remove token creators", async function () {
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR,
          0,
          1
        );
        await expectDenyRevokeRole(
          this.tc,
          TestAccounts.XMANAGER2,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_CREATOR,
          0,
          "must be registry manager"
        );
      });

      it("should not add token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectDenyGrantRole(
          this.tc,
          TestAccounts.XMANAGER2,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          "must be token manager"
        );
      });

      it("should not remove token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        await expectGrantRole(
          this.tc,
          TestAccounts.OWNER,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          1
        );
        await expectDenyRevokeRole(
          this.tc,
          TestAccounts.XMANAGER2,
          TestAccounts.XMANAGER1,
          Roles.TOKEN_MANAGER,
          1,
          "must be token manager"
        );
      });

      it("should not list token managers", async function () {
        await expectMintToken(this.tc, TestAccounts.OWNER, 1);
        const managers = [
          TestAccounts.TMANAGER1,
          TestAccounts.TMANAGER2,
        ]
        await expectDenyGetManagerList(this.tc, Roles.TOKEN_MANAGER, TestAccounts.OWNER, TestAccounts.XMANAGER2, managers, 1);
      });

      it("should be denied checking account role");
    });
  });

  describe("registry owner only tests", function () {
    it("should create contract with the correct owner", async function () {
      expect(await this.tc.registryContract.owner()).to.equal(
        getAccountAddress(this.tc.accounts, TestAccounts.OWNER)
      );
    });
  });

  describe("registry managers tests", function () {
    describe("as non registry manager", function () {
      let otherConnectedContract: Contract;

      beforeEach(async function () {
        otherConnectedContract = getConnectedContract(
          this.tc.registryContract,
          this.tc.accounts,
          TestAccounts.XMANAGER2
        );
      });

      it("should not get registry managers count", async function () {
        const ownerConnectedContract = getConnectedContract(
          this.tc.registryContract,
          this.tc.accounts,
          TestAccounts.OWNER
        );
        await grantRole(
          ownerConnectedContract,
          this.tc.accounts,
          TestAccounts.RMANAGER1,
          Roles.REGISTRY_MANAGER
        );

        await expect(
          otherConnectedContract.roleCount(Roles.REGISTRY_MANAGER, 0)
        ).to.be.revertedWith("must be registry manager");
      });
    });
  });

}

export {
  shouldBehaveLikeMDRTCore
}