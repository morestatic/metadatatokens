import { ethers } from "hardhat";
import { expect } from "chai";

import {
  TestCtx,
  ChangeType,
  Roles,
  TestAccounts,
  initialDataUri,
  waitForTx,
  getAccountAddress,
  mintToken,
  getConnectedContract,
  applyAndUseTokenManagerContract,
  grantRole,
  grantRoleTxOnly,
  revokeRole,
  revokeRoleTxOnly,
  hasRole,
} from "./shared";

async function expectMintToken(tc: TestCtx, account: TestAccounts, expectedTokenId: number = 1): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const tx = await contract.mint(initialDataUri);
  // then
  await expect(tx)
    .to.emit(contract, "Transfer")
    .withArgs(ethers.constants.AddressZero, getAccountAddress(tc.accounts, account), expectedTokenId);
}

async function expectFailMintTokenWhenTokenManager(
  tc: TestCtx,
  account: TestAccounts,
  tokenManagerAccount: TestAccounts
): Promise<void> {
  // given
  const initialContract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const tokenId = await mintToken(initialContract);
  const contract = applyAndUseTokenManagerContract(initialContract, tc.accounts, tokenManagerAccount, tokenId);
  // then
  await expect(contract.mint(initialDataUri)).to.be.revertedWith("must be creator");
}

async function expectBurnToken(
  tc: TestCtx,
  account: TestAccounts,
  tokenManagerAccount: TestAccounts | null = null
): Promise<void> {
  // given
  const initialContract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const tokenId = await mintToken(initialContract);
  let contract = initialContract;
  if (tokenManagerAccount !== null) {
    contract = applyAndUseTokenManagerContract(contract, tc.accounts, tokenManagerAccount, tokenId);
  }
  // when
  const burnTx = await contract.burn(tokenId);
  await waitForTx(burnTx);
  // then
  await expect(contract.dataURI(tokenId)).to.be.revertedWith("ERC721URIStorage: URI query for nonexistent token");
}

async function expectBurnTokenById(tc: TestCtx, account: TestAccounts, tokenId: number): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const burnTx = await contract.burn(tokenId);
  await waitForTx(burnTx);
  // then
  await expect(contract.dataURI(tokenId)).to.be.revertedWith("ERC721URIStorage: URI query for nonexistent token");
}

async function expectBurnTokenWithEmit(tc: TestCtx, account: TestAccounts): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const tokenId = await mintToken(contract);
  // when
  const burnTx = await contract.burn(tokenId);
  // then
  await expect(burnTx)
    .to.emit(contract, "Transfer")
    .withArgs(getAccountAddress(tc.accounts, account), ethers.constants.AddressZero, tokenId);
}

async function expectBurnFailWhenNonExistentToken(tc: TestCtx, account: TestAccounts): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // then / when
  await expect(contract.burn(99)).to.be.revertedWith("ERC721: owner query for nonexistent token");
}

async function expectBurnFailWhenTokenManager(
  tc: TestCtx,
  account: TestAccounts,
  tokenManagerAccount: TestAccounts
): Promise<void> {
  // given
  const initialContract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const tokenId = await mintToken(initialContract);
  const contract = applyAndUseTokenManagerContract(initialContract, tc.accounts, tokenManagerAccount, tokenId);
  // then / when
  await expect(contract.burn(tokenId)).to.be.revertedWith("must be owner or registry manager");
}

async function expectBurnFailTokenById(tc: TestCtx, account: TestAccounts, tokenId: number): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // then / when
  await expect(contract.burn(tokenId)).to.be.revertedWith("must be owner or registry manager");
}

async function expectGetDataURI(
  tc: TestCtx,
  account: TestAccounts,
  tokenManagerAccount: TestAccounts | null = null
): Promise<void> {
  // given
  const initialContract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const tokenId = await mintToken(initialContract);
  let contract = initialContract;
  if (tokenManagerAccount !== null) {
    contract = applyAndUseTokenManagerContract(contract, tc.accounts, tokenManagerAccount, tokenId);
  }
  // when
  const dataURI = await contract.dataURI(tokenId);
  // then
  expect(dataURI, `unexpected dataURI ${dataURI}`).to.equal(initialDataUri);
}

async function expectGetTokenURI(
  tc: TestCtx,
  account: TestAccounts,
  tokenManagerAccount: TestAccounts | null = null
): Promise<void> {
  // given
  const initialContract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const tokenId = await mintToken(initialContract);
  let contract = initialContract;
  if (tokenManagerAccount !== null) {
    contract = applyAndUseTokenManagerContract(contract, tc.accounts, tokenManagerAccount, tokenId);
  }
  // when
  const tokenURI = await contract.tokenURI(tokenId);
  // then
  expect(tokenURI, `unexpected tokenURI ${tokenURI}`).to.equal(initialDataUri);
}

async function expectUpdateDataURI(
  tc: TestCtx,
  account: TestAccounts,
  tokenManagerAccount: TestAccounts | null = null
): Promise<void> {
  // given
  const updatedDataUri = "https://QmV8YFywaXWbgSVpxHXLNcxsZuXUKSahq1Y7YbmePyJaqo.discogs.ipfs.disc3.xyz";
  const initialContract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const tokenId = await mintToken(initialContract);
  let contract = initialContract;
  if (tokenManagerAccount !== null) {
    contract = applyAndUseTokenManagerContract(contract, tc.accounts, tokenManagerAccount, tokenId);
  }
  // when
  const updateTx = await contract.updateDataURI(tokenId, updatedDataUri);
  await waitForTx(updateTx);
  // then
  const dataURI = await contract.dataURI(tokenId);
  expect(dataURI).to.equal(updatedDataUri);
}

async function expectUpdateAndGetRefSpec(tc: TestCtx, account: TestAccounts, tokenId: number): Promise<void> {
  // given
  const updatedRefSpec = "updated ref spec";
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const updateTx = await contract.updateRefSpec(tokenId, updatedRefSpec);
  await waitForTx(updateTx);
  const refSpec = await contract.refSpec(tokenId);
  // then
  expect(refSpec).to.equal(updatedRefSpec);
}

async function expectDenyRefSpecUpdate(tc: TestCtx, account: TestAccounts, tokenId: number): Promise<void> {
  // given
  const updatedRefSpec = "updated ref spec";
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // then / when
  await expect(contract.updateRefSpec(tokenId, updatedRefSpec)).to.be.revertedWith("must be token manager");
}

async function expectDenyDefaultRefSpecUpdate(tc: TestCtx, account: TestAccounts, tokenId: number): Promise<void> {
  // given
  const updatedRefSpec = "updated ref spec";
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // then / when
  await expect(contract.updateDefaultRefSpec(updatedRefSpec)).to.be.revertedWith("must be registry manager");
}

async function expectGetRefSpec(tc: TestCtx, account: TestAccounts, tokenId: number): Promise<void> {
  // given
  const updatedRefSpec = "updated ref spec";
  const ownerContract = getConnectedContract(tc.registryContract, tc.accounts, TestAccounts.OWNER);
  const updateTx = await ownerContract.updateRefSpec(tokenId, updatedRefSpec);
  await waitForTx(updateTx);
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const refSpec = await contract.refSpec(tokenId);
  // then
  expect(refSpec).to.equal(updatedRefSpec);
}

async function expectGetRefSpecUsingDefault(tc: TestCtx, account: TestAccounts, tokenId: number): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const updatedRefSpec = "updated ref spec";
  const ownerContract = getConnectedContract(tc.registryContract, tc.accounts, TestAccounts.OWNER);
  const updateTx = await ownerContract.updateDefaultRefSpec(updatedRefSpec);
  await waitForTx(updateTx);
  // when
  const refSpec = await contract.refSpec(tokenId);
  // then
  expect(refSpec).to.equal(updatedRefSpec);
}

async function expectUpdateAndGetDefaultRefSpec(tc: TestCtx, account: TestAccounts, tokenId: number): Promise<void> {
  // given
  const updatedRefSpec = "updated default ref spec";
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const updateTx = await contract.updateDefaultRefSpec(updatedRefSpec);
  await waitForTx(updateTx);
  const refSpec = await contract.refSpec(tokenId); // should return default ref spec
  // then
  expect(refSpec).to.equal(updatedRefSpec);
}

async function expectUpdateAndEmitDefaultRefSpecUpdate(
  tc: TestCtx,
  account: TestAccounts,
  tokenId: number
): Promise<void> {
  // given
  const updatedRefSpec = "updated default ref spec";
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const runAccountAddress = getAccountAddress(tc.accounts, account);
  // when
  const updateTx = await contract.updateDefaultRefSpec(updatedRefSpec);
  // then
  await waitForTx(updateTx);
  await expect(updateTx)
    .to.emit(contract, "DefaultRefSpecUpdate")
    .withArgs(runAccountAddress, tokenId + 1, updatedRefSpec);
}

async function expectSeqNum(
  tc: TestCtx,
  account: TestAccounts,
  tokenId: number,
  expectedSeqNum: number
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const seqNum = await contract.seqNum(tokenId);
  // then
  expect(seqNum).to.equal(expectedSeqNum);
}

async function expectUpdateRefSpecWithEmit(tc: TestCtx, account: TestAccounts, tokenId: number): Promise<void> {
  // given
  const updatedRefSpec = "updated ref spec";
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const runAccountAddress = getAccountAddress(tc.accounts, account);
  // when
  const updateTx = await contract.updateRefSpec(tokenId, updatedRefSpec);
  // then
  await expect(updateTx).to.emit(contract, "RefSpecUpdate").withArgs(runAccountAddress, tokenId, [1, updatedRefSpec]);
}

async function expectUpdateDataURIForToken(
  tc: TestCtx,
  account: TestAccounts,
  tokenId: number,
  updatedDataUri: string
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const updateTx = await contract.updateDataURI(tokenId, updatedDataUri);
  await waitForTx(updateTx);
  // then
  const dataURI = await contract.dataURI(tokenId);
  expect(dataURI).to.equal(updatedDataUri);
}

async function expectSetTokenURIForToken(
  tc: TestCtx,
  account: TestAccounts,
  tokenId: number,
  updatedDataUri: string
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const updateTx = await contract.setTokenURI(tokenId, updatedDataUri);
  await waitForTx(updateTx);
  // then
  const dataURI = await contract.tokenURI(tokenId);
  expect(dataURI).to.equal(updatedDataUri);
}

async function expectDenyUpdateDataURIForToken(
  tc: TestCtx,
  account: TestAccounts,
  tokenId: number,
  updatedDataUri: string
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // then / when
  await expect(contract.updateDataURI(tokenId, updatedDataUri)).to.be.revertedWith("must be token manager");
}

async function expectUpdateDataURIForTokenWithEmit(
  tc: TestCtx,
  account: TestAccounts,
  tokenId: number,
  seqNum: number
): Promise<void> {
  // given
  const updatedDataUri = "https://QmV8YFywaXWbgSVpxHXLNcxsZuXUKSahq1Y7YbmePyJaqo.discogs.ipfs.disc3.xyz";
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const runAccountAddress = getAccountAddress(tc.accounts, account);
  // when
  const updateTx = await contract.updateDataURI(tokenId, updatedDataUri);
  // then
  await expect(updateTx)
    .to.emit(contract, "TokenURIUpdate")
    .withArgs(runAccountAddress, tokenId, updatedDataUri, seqNum);
}

async function expectUpdateDataURIWithEmit(tc: TestCtx, account: TestAccounts): Promise<void> {
  // given
  const updatedDataUri = "https://QmV8YFywaXWbgSVpxHXLNcxsZuXUKSahq1Y7YbmePyJaqo.discogs.ipfs.disc3.xyz";
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const runAccountAddress = getAccountAddress(tc.accounts, account);
  const tokenId = await mintToken(contract);
  // when
  const updateTx = await contract.updateDataURI(tokenId, updatedDataUri);
  // then
  await expect(updateTx).to.emit(contract, "TokenURIUpdate").withArgs(runAccountAddress, tokenId, updatedDataUri, 0);
}

async function expectGrantRole(
  tc: TestCtx,
  account: TestAccounts,
  newAccount: TestAccounts,
  role: Roles,
  tokenId: number,
  expectedTotal: number
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  await grantRole(contract, tc.accounts, newAccount, role, tokenId);
  // then
  const numManagers = await contract.roleCount(role, tokenId);
  expect(numManagers).to.equal(expectedTotal);
  const hasAssignedRole = await hasRole(contract, tc.accounts, newAccount, role, tokenId);
  expect(hasAssignedRole).to.be.true;
}

async function expectNoPermissionWhenUnknownRole(
  tc: TestCtx,
  account: TestAccounts,
  accountToCheck: TestAccounts,
  role: Roles,
  tokenId: number
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const has = await hasRole(contract, tc.accounts, accountToCheck, role, tokenId);
  // then
  expect(has).to.be.false;
}

async function expectNoMembersForUnknownRole(
  tc: TestCtx,
  account: TestAccounts,
  role: Roles,
  tokenId: number
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when
  const numManagers = await contract.roleCount(role, tokenId);
  // then
  expect(numManagers).to.equal(0);
}

async function expectGetManagerList(
  tc: TestCtx,
  role: Roles,
  runAsAccount: TestAccounts,
  accounts: TestAccounts[],
  tokenId: number = 0
): Promise<void> {
  let accountAddresses: string[] = [];
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, runAsAccount);
  await Promise.all(accounts.map(async acc => {
    await grantRole(contract, tc.accounts, acc, role, tokenId);
    accountAddresses.push(getAccountAddress(tc.accounts, acc));
  }));
  const numManagers = await contract.roleCount(role, tokenId);
  expect(numManagers).to.equal(accounts.length);
  for (let i: number = 0; i < numManagers; i += 1) {
    // when
    const acc = await contract.managerAt(role, i, tokenId);
    // then
    const exists = accountAddresses.includes(acc);
    expect(exists).to.be.true;
  }
}

async function expectDenyGetManagerList(
  tc: TestCtx,
  role: Roles,
  grantAsAccount: TestAccounts,
  runAsAccount: TestAccounts,
  accounts: TestAccounts[],
  tokenId: number = 0
): Promise<void> {
  let accountAddresses: string[] = [];
  // given
  const grantAsContract = getConnectedContract(tc.registryContract, tc.accounts, grantAsAccount);
  await Promise.all(accounts.map(async acc => {
    await grantRole(grantAsContract, tc.accounts, acc, role, tokenId);
    accountAddresses.push(getAccountAddress(tc.accounts, acc));
  }));
  let reason: string = "n/a";
  switch(role) {
    case Roles.REGISTRY_MANAGER:
      reason = "must be registry manager";
      break;
    case Roles.TOKEN_MANAGER:
      reason = "must be token manager";
      break;
  }
  const contract = getConnectedContract(tc.registryContract, tc.accounts, runAsAccount);
  await expect(contract.roleCount(role, tokenId), "roleCount").to.be.revertedWith(reason);

  for (let i: number = 0; i < accounts.length; i += 1) {
  // when / then
  await expect(contract.managerAt(role, i, tokenId), "managerAt").to.be.revertedWith(reason);
  }
}

async function expectRevertWhenManagerAtForUnknownRole(
  tc: TestCtx,
  account: TestAccounts,
  role: Roles,
  tokenId: number
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  // when / then
  await expect(contract.managerAt(Roles.NONE, 0, 0), "managerAt").to.be.revertedWith('role not found');
}

async function expectGrantRoleWithEmit(
  tc: TestCtx,
  account: TestAccounts,
  newAccount: TestAccounts,
  role: Roles,
  tokenId: number
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const runAccountAddress = getAccountAddress(tc.accounts, account);
  const newAccountAddress = getAccountAddress(tc.accounts, newAccount);

  // when
  const grantTx = await grantRoleTxOnly(contract, tc.accounts, newAccount, role, tokenId);

  // then
  if (role === Roles.REGISTRY_MANAGER) {
    await expect(grantTx)
      .to.emit(contract, "RegistryManagerUpdate")
      .withArgs(newAccountAddress, runAccountAddress, ChangeType.Grant);
  } else if (role === Roles.TOKEN_MANAGER) {
    await expect(grantTx)
      .to.emit(contract, "TokenManagerUpdate")
      .withArgs(newAccountAddress, runAccountAddress, tokenId, ChangeType.Grant);
  }
}

async function expectRevokeRole(
  tc: TestCtx,
  account: TestAccounts,
  oldAccount: TestAccounts,
  role: Roles,
  tokenId: number,
  expectedTotal: number
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);

  // when
  await revokeRole(contract, tc.accounts, oldAccount, role, tokenId);

  // then
  const numManagers = await contract.roleCount(role, tokenId);
  expect(numManagers).to.equal(expectedTotal);
  const hasAssignedRole = await hasRole(contract, tc.accounts, oldAccount, role, tokenId);
  expect(hasAssignedRole).to.be.false;
}

async function expectRevokeRoleWithEmit(
  tc: TestCtx,
  account: TestAccounts,
  oldAccount: TestAccounts,
  role: Roles,
  tokenId: number
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const runAccountAddress = getAccountAddress(tc.accounts, account);
  const oldAccountAddress = getAccountAddress(tc.accounts, oldAccount);

  // when
  const grantTx = await revokeRoleTxOnly(contract, tc.accounts, oldAccount, role, tokenId);

  // expect
  if (role === Roles.REGISTRY_MANAGER) {
    await expect(grantTx)
      .to.emit(contract, "RegistryManagerUpdate")
      .withArgs(oldAccountAddress, runAccountAddress, ChangeType.Revoke);
  } else if (role === Roles.TOKEN_MANAGER) {
    await expect(grantTx)
      .to.emit(contract, "TokenManagerUpdate")
      .withArgs(oldAccountAddress, runAccountAddress, tokenId, ChangeType.Revoke);
  }
}

async function expectDenyGrantRole(
  tc: TestCtx,
  account: TestAccounts,
  newAccount: TestAccounts,
  role: Roles,
  tokenId: number,
  reason: string
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const newAccountAddress = getAccountAddress(tc.accounts, newAccount);
  // expect / when
  await expect(contract.grant(role, newAccountAddress, tokenId)).to.be.revertedWith(reason);
}

async function expectDenyRevokeRole(
  tc: TestCtx,
  account: TestAccounts,
  oldAccount: TestAccounts,
  role: Roles,
  tokenId: number,
  reason: string
): Promise<void> {
  // given
  const contract = getConnectedContract(tc.registryContract, tc.accounts, account);
  const oldAccountAddress = getAccountAddress(tc.accounts, oldAccount);
  // expect / when
  await expect(contract.revoke(role, oldAccountAddress, tokenId)).to.be.revertedWith(reason);
}

export {
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
  expectUpdateDataURIForTokenWithEmit,
  expectUpdateDataURIWithEmit,
  expectGrantRole,
  expectGrantRoleWithEmit,
  expectRevokeRole,
  expectRevokeRoleWithEmit,
  expectDenyGrantRole,
  expectDenyRevokeRole,
  expectNoPermissionWhenUnknownRole,
  expectNoMembersForUnknownRole,
  expectUpdateAndGetRefSpec,
  expectDenyRefSpecUpdate,
  expectSeqNum,
  expectUpdateRefSpecWithEmit,
  expectUpdateAndGetDefaultRefSpec,
  expectUpdateAndEmitDefaultRefSpecUpdate,
  expectGetRefSpec,
  expectGetRefSpecUsingDefault,
  expectDenyDefaultRefSpecUpdate,
  expectGetManagerList,
  expectDenyGetManagerList,
  expectRevertWhenManagerAtForUnknownRole
};
