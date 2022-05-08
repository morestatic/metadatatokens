import { ethers, waffle } from "hardhat";
import { Contract, Transaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TransactionReceipt } from "@ethersproject/abstract-provider";

enum RunningStates {
  OK = 0,
  READONLY = 1,
  PAUSED = 2,
  HALTED = 3
};

enum ChangeType {
  Grant = 0,
  Revoke = 1
}

enum ErrorMessages {
  HALTED = "c! is halted",
  PAUSED = "c! is paused",
  READONLY = "c! is read only"
};

enum Roles {
  NONE = 0,
  REGISTRY_OWNER = 1,
  REGISTRY_MANAGER = 2,
  TOKEN_CREATOR = 3,
  TOKEN_MANAGER = 4,
}

enum TestAccounts {
  OWNER = 0,
  RMANAGER1,
  RMANAGER2,
  TMANAGER1,
  TMANAGER2,
  XMANAGER1,
  XMANAGER2,
  __NUM_ACCOUNTS
};

export type TestCtx = {
  registryContract: Contract,
  accounts: Array<SignerWithAddress>
}

const initialDataUri = "https://QmV8YFywaXWbgSVpxHXLNcxsZuXUKSahq1Y7YbmePyJaqo.discogs.ipfs.disc3.xyz"

async function deployContract(contractName: string): Promise<Contract> {
  const contractFactory = await ethers.getContractFactory(contractName);
  const deployedContract = await contractFactory.deploy(
    "PIR 1",
    "PIR1"
  );
  await deployedContract.deployed();
  return deployedContract;
}

async function getAccounts(): Promise<Array<SignerWithAddress>> {
  const accounts = new Array<SignerWithAddress>(TestAccounts.__NUM_ACCOUNTS);
  [
    accounts[TestAccounts.OWNER],
    accounts[TestAccounts.RMANAGER1],
    accounts[TestAccounts.RMANAGER2],
    accounts[TestAccounts.TMANAGER1],
    accounts[TestAccounts.TMANAGER2],
    accounts[TestAccounts.XMANAGER1],
    accounts[TestAccounts.XMANAGER2],
  ] = await ethers.getSigners();
  return accounts;
}

async function waitForTx(tx: Transaction): Promise<TransactionReceipt | null> {
  const provider = waffle.provider;

  if (!tx.hash) {
    return null;
  }

  const receipt = await provider.waitForTransaction(tx.hash);
  return receipt;
}

async function getTokenIdFromTx(tx: Transaction): Promise<number> {
  const receipt = await waitForTx(tx);
  if (!receipt) {
    return 0;
  }

  const tokenId = Number(receipt.logs[0].topics[3]);
  return tokenId;
}

function getAccountAddress(accounts: SignerWithAddress[], testAccount: TestAccounts): string {
  return accounts[testAccount].address;
}

async function mintToken(contract: Contract, coreInfoUrl: string | undefined = undefined): Promise<number> {
  const tokenTx = await contract.mint(coreInfoUrl || initialDataUri);
  const tokenId = await getTokenIdFromTx(tokenTx);
  return tokenId;
}

function getConnectedContract(contract: Contract, accounts: SignerWithAddress[], testAccount: TestAccounts): Contract {
  const account = accounts[testAccount];
  const connectedContract = contract.connect(account);
  return connectedContract;
}

function applyAndUseTokenManagerContract(connectedContract: Contract, accounts: SignerWithAddress[], tokenManagerAccount: TestAccounts, tokenId: number): Contract {
  grantRole(connectedContract, accounts, tokenManagerAccount, Roles.TOKEN_MANAGER, tokenId);
  const tokenManagerContract = getConnectedContract(connectedContract, accounts, tokenManagerAccount);
  return tokenManagerContract;
}

async function grantRole(connectedContract: Contract, accounts: SignerWithAddress[], testAccount: TestAccounts, role: Roles, tokenId: number = 0): Promise<TransactionReceipt | null> {
  const managerTx = await connectedContract.grant(role, getAccountAddress(accounts, testAccount), tokenId);
  const receipt = await waitForTx(managerTx);
  return receipt;
}

async function grantRoleTxOnly(connectedContract: Contract, accounts: SignerWithAddress[], testAccount: TestAccounts, role: Roles, tokenId: number = 0): Promise<TransactionReceipt | null> {
  const grantTx = await connectedContract.grant(role, getAccountAddress(accounts, testAccount), tokenId);
  return grantTx;
}

async function revokeRoleTxOnly(connectedContract: Contract, accounts: SignerWithAddress[], testAccount: TestAccounts, role: Roles, tokenId: number = 0): Promise<TransactionReceipt | null> {
  const revokeTx = await connectedContract.revoke(role, getAccountAddress(accounts, testAccount), tokenId);
  return revokeTx;
}

async function revokeRole(connectedContract: Contract, accounts: SignerWithAddress[], testAccount: TestAccounts, role: Roles, tokenId: number = 0): Promise<void> {
  const managerTx = await connectedContract.revoke(role, getAccountAddress(accounts, testAccount), tokenId);
  await waitForTx(managerTx);
}

async function hasRole(connectedContract: Contract, accounts: SignerWithAddress[], testAccount: TestAccounts, role: Roles, tokenId: number = 0): Promise<boolean> {
  return await connectedContract.hasRole(role, getAccountAddress(accounts, testAccount), tokenId);
}

async function grantRegistryManager(connectedContract: Contract, accounts: SignerWithAddress[], testAccount: TestAccounts): Promise<void> {
  await grantRole(connectedContract, accounts, testAccount, Roles.REGISTRY_MANAGER);
}

async function grantTokenCreator(connectedContract: Contract, accounts: SignerWithAddress[], testAccount: TestAccounts): Promise<void> {
  await grantRole(connectedContract, accounts, testAccount, Roles.TOKEN_CREATOR);
}

async function grantTokenManager(connectedContract: Contract, accounts: SignerWithAddress[], testAccount: TestAccounts, tokenId: number): Promise<void> {
  await grantRole(connectedContract, accounts, testAccount, Roles.TOKEN_MANAGER, tokenId);
}

async function prepareForMintingTests(registryContract: Contract, accounts: SignerWithAddress[]): Promise<{ managerConnectedContract: Contract, creatorConnectedContract: Contract }> {
  const ownerConnectedContract = getConnectedContract(registryContract, accounts, TestAccounts.OWNER);
  await grantRegistryManager(ownerConnectedContract, accounts, TestAccounts.RMANAGER1);
  const managerConnectedContract = getConnectedContract(registryContract, accounts, TestAccounts.RMANAGER1);
  await grantTokenCreator(managerConnectedContract, accounts, TestAccounts.XMANAGER1);
  const creatorConnectedContract = getConnectedContract(registryContract, accounts, TestAccounts.XMANAGER1);

  return { managerConnectedContract, creatorConnectedContract }
}


export {
  RunningStates,
  ChangeType,
  ErrorMessages,
  Roles,
  TestAccounts,
  initialDataUri,
  deployContract,
  getAccounts,
  waitForTx,
  getTokenIdFromTx,
  getAccountAddress,
  mintToken,
  getConnectedContract,
  grantRole,
  grantRoleTxOnly,
  revokeRole,
  revokeRoleTxOnly,
  hasRole,
  grantRegistryManager,
  grantTokenCreator,
  grantTokenManager,
  applyAndUseTokenManagerContract,
  prepareForMintingTests,
}