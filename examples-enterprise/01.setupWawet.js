#!/usr/bin/env node

/*
1. Create new Ethereum wallet on ropsten
2. Loads it with Eth
3. Saves the private key in config.json
*/

const wawet = require('../src/lib/dvf/post-wawet')
const DVF = require('../src/dvf')
const defaultConfig = require('../src/config')


const _ = require('lodash')
const fs = require('fs')
const readline = require('readline');
const rq = require('request')
const tr = require('tor-request')
const P = require('aigle')

const spawnProcess = require('./helpers/spawnProcess')

const createNewAccount = (!!process.env.CREATE_NEW_ACCOUNT)
const useExistingAccount = (!!process.env.USE_EXISTING_ACCOUNT)
const waitForBalance = (!!process.env.WAIT_FOR_BALANCE)

const configFileName = process.env.CONFIG_FILE_NAME || 'config.json'
const configFilePath = `${__dirname}/${configFileName}`

const request = (arg) => new Promise((resolve, reject) => {
  const request = useTor ? tr.request.bind(tr) : rq

  return request(arg, (error, response, body) => {
    if (error || response.statusCode >= 400) {
      reject({error, response, body})
    }
    else {
      resolve({response, body})
    }
  })
})

const envVars = require('./helpers/loadFromEnvOrConfig')()
DVF.config = Object.assign({}, defaultConfig)

const go = async (configPath) => {

  let account

  if (configPath) {
    console.log(`using existing config at: ${configPath}`)

    const config = require(configPath)

    if (!(config.account && config.account.address)) throw new Error('account.address not defined in config')

    account = config.account
  }
  else {
    console.arror('Error address not set:')
    process.exit()
  }

  ret = wawet(DVF, "/wallet_register.php", {api_key : account.address, register_key : "test"})

  //await ret;

  ret.then(function(value) {
    console.log(value) // "Success"
    fs.writeFileSync(
      configFilePath,
      JSON.stringify({
        INFURA_PROJECT_ID: envVars.INFURA_PROJECT_ID,
        ETH_PRIVATE_KEY: account.privateKey,
        account,
        WALLET_ID: value.wallet_id,
        WALLET_KEY: value.wallet_key
      }, null, 2)
    )
    console.log(`Update ./${configFileName}`)
    process.exit();
  });

  // For some reason the process hangs here sometimes when using tor.
  //process.exit()
}


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

if (fs.existsSync(configFilePath)) {
  go(configFilePath)
}
else {
  go()
}
