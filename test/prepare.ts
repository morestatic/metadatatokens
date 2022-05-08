import { Contract } from "ethers";

import {
  RunningStates,
  Roles,
  TestAccounts,
  TestCtx,
  getConnectedContract,
  mintToken,
  grantRole,
} from "./shared";

async function prepareSingleToken(tc: TestCtx, runState: RunningStates = RunningStates.OK): Promise<number> {
  const ownerConnectedContract = getConnectedContract(tc.registryContract, tc.accounts, TestAccounts.OWNER);
  await ownerConnectedContract.setRunningState(RunningStates.OK)
  const tokenId = await mintToken(ownerConnectedContract);
  await ownerConnectedContract.setRunningState(runState);
  return tokenId;
}

async function prepareTestToken(tc: TestCtx, tokenCreatingAccount: TestAccounts, managingAccount: TestAccounts | null = null): Promise<number> {
  const ownerConnectedContract = getConnectedContract(tc.registryContract, tc.accounts, TestAccounts.OWNER);
  grantRole(ownerConnectedContract, tc.accounts, tokenCreatingAccount, Roles.TOKEN_CREATOR, 0);
  const connectedContract = getConnectedContract(ownerConnectedContract, tc.accounts, tokenCreatingAccount);
  const tokenId = await mintToken(connectedContract);
  if (managingAccount !== null) {
    grantRole(ownerConnectedContract, tc.accounts, managingAccount, Roles.TOKEN_MANAGER, tokenId);
  }
  return tokenId;
}

export {
  prepareSingleToken,
  prepareTestToken,
}