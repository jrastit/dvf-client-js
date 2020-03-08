#!/usr/bin/env node

/*
1. Create new Ethereum wallet on ropsten
2. Loads it with Eth
3. Saves the private key in config.json
*/


const _ = require('lodash')
const fs = require('fs')
const readline = require('readline');
const Web3 = require('web3')
const rq = require('request')
const tr = require('tor-request')
const P = require('aigle')

const spawnProcess = require('./helpers/spawnProcess')

const INFURA_PROJECT_ID = process.argv[2]
const useTor = (!!process.env.USE_TOR)
const createNewAccount = (!!process.env.CREATE_NEW_ACCOUNT)
const useExistingAccount = (!!process.env.USE_EXISTING_ACCOUNT)
const waitForBalance = (!!process.env.WAIT_FOR_BALANCE)

if (!INFURA_PROJECT_ID) {
  console.error('Error: INFURA_PROJECT_ID not set')
  console.error('\nusage: ./0.setup.js INFURA_PROJECT_ID')
  console.error('\n  you can obtain an INFURA_PROJECT_ID by following instructions here: https://ethereumico.io/knowledge-base/infura-api-key-guide ')
  console.error('    NOTE: the `API KEY` mentioned in the instructions has been renamed to `PROJECT ID`.')
  console.error('\n  if you get an error when requesting Eth from a faucet, set USE_TOR=1 env var to make requests via a TOR (using https://www.npmjs.com/package/tor-request)')
  console.error('    NOTE: tor executable needs to be on your path for this to work (it will be started/stopped automatically)')
  console.error('    tor can be installed via brew on MacOS or using your distros package manager if you are using linux')
  process.exit(1)
}

const configFileName = process.env.CONFIG_FILE_NAME || 'config.json'
const configFilePath = `${__dirname}/${configFileName}`
const go = async (configPath) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(
    `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`
  ));

  let account

  if (configPath) {
    console.log(`using existing config at: ${configPath}`)

    const config = require(configPath)

    if (!(config.account && config.account.address)) throw new Error('account.address not defined in config')

    account = config.account
  }
  else {
    account = web3.eth.accounts.create()

    console.log('Created new Ethereum account:', account.address)

    fs.writeFileSync(
      configFilePath,
      JSON.stringify({
        INFURA_PROJECT_ID,
        ETH_PRIVATE_KEY: account.privateKey,
        account
      }, null, 2)
    )

    console.log(`Created ./${configFileName}`)
  }

  // For some reason the process hangs here sometimes when using tor.
  process.exit()
}


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

if (fs.existsSync(configFilePath)) {
  if (useExistingAccount) {
    go(configFilePath)
  } else if (createNewAccount) {
    go()
  } else {
    rl.question(
      `The ./${configFileName} file exits, do you want to use this config?
      If you choose 'yes', existing ./${configFileName} will not be modified and Eth will be added to the account found in this config.
      If you chooce 'no', a new account will be created, Eth added to it and the ./${configFileName} file overwritten (yes/no): `,
      (answer) => {
        rl.close()
        if (answer == 'yes') {
          go(configFilePath)
        }
        else {
          go()
        }
      }
    )
  }
}
else {
  go()
}
