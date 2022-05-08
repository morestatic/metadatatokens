import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "solidity-coverage"
import "@nomiclabs/hardhat-truffle5";
import "hardhat-tracer";
import "hardhat-docgen";

// ec9cc847 - bbb0 - 4ab8 - 82b2 - 1cf2b629831a
import ENV from "./hardhat.env"

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config = {
  solidity: "0.8.9",
  settings: {
    optimizer: {
      enabled: true,
    }
  },
  networks: {
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ENV.alchemyMumbaiApiKey}`,
      accounts: [ENV.testAccount1MumbaiPrivateKey]
    }
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    coinmarketcap: ENV.coincoinmarketcapKey,
    token: "ETH",
    excludeContracts: ['contracts/mocks'],
  },
  contractSizer: {
    except: ['^contracts/test/', '^contracts/mocks/']
  },
  docgen: {
    except: ['^contracts/test/', '^contracts/mocks/']
  }
};

export default config;