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

const useTor = (!!process.env.USE_TOR)
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

const ethRequestOptsForUrl = {
  'https://faucet.ropsten.be': ( address ) => `https://faucet.ropsten.be/donate/${address}`,
  // This one gives on only 0.5 eth
  'https://ropsten.faucet.b9lab.com': ( address ) => {
    return {
      uri: 'https://ropsten.faucet.b9lab.com/tap',
      method: 'POST',
      json: true,
      body: { toWhom: address }
    }
  },
  'https://faucet.metamask.io': ( address ) => {
    return {
      uri: 'https://faucet.metamask.io',
      method: 'POST',
      form: address
    }
  }
}

const getBalanceInEth = async (web3, address) => {
  return web3.utils.fromWei(
    await web3.eth.getBalance(address),
    'ether'
  )
}

const checkBalance = async (web3, address, requiredBalance) => {
  console.log('checking balance')
  console.log('requiredBalance (ETH):', requiredBalance)
  const balance = await getBalanceInEth(web3, address)
  console.log('account balance (ETH):', balance)
  if (balance < requiredBalance) {
    throw new Error(`unsufficient balance: ${balance}, requiredBalance: ${requiredBalance}`)
  }
}

const requestEth = (serviceUrl, address) => {
  console.log(`Requesting Eth from: ${serviceUrl}`)

  return request(ethRequestOptsForUrl[serviceUrl](address))
  .then(({ response, body }) => {

    // ropsten.faucet.b9lab.com still responds with 200 if rate limiting kicks
    // in, so we need to parse the error from the body.
    if (_.get(body, 'txHash.errorMessage')) throw { response, body }

    console.log(`Request for Eth from ${serviceUrl} succeeded! Response body:`, body)
    console.log('Please allow some time for the transaction to be validated.')
    return true;
  })
  .catch(data => {
    console.error(`Request for Eth from ${serviceUrl} failed!`, {
      error: data.error,
      statusCode: data.response && data.response.statusCode,
      body: data.body
    })
    return false
  })
}

const maybeSpawnTor = () => {
  if (!useTor) return

  console.log('Starting TOR...')

  return spawnProcess({
    command: [ 'tor' ],
    waitForLogOnInit: /.*Bootstrapped 100% \(done\): Done.*/,
    log: false
  })
}

const maybeKillTor = async (torProcess) => {
  if (!useTor) return

  console.log('Killing TOR...')

  await torProcess.kill(null, 'SIGINT')
  console.log('TOR killed.')
}

const getEth = async (address) => {
  const torProcess = await maybeSpawnTor()

  let gotEth = await requestEth('https://faucet.metamask.io', address)

  if (!gotEth) {
    gotEth = await requestEth('https://faucet.ropsten.be', address)
  }

  await maybeKillTor(torProcess)

  return gotEth
}

const go = async () => {

  const web3 = new Web3(new Web3.providers.HttpProvider(
    `https://ropsten.infura.io/v3/${envVars.INFURA_PROJECT_ID}`
  ));

  console.log("Key: " + envVars.WALLET_KEY)

  const gotEth = await getEth(envVars.WALLET_KEY)

  if (!gotEth) {
    console.error('attempts to get Eth failed!')
    process.exit(1)
  }
  if (waitForBalance) {
    await P.retry(
      { times: 120, interval: 1000 },
      () => checkBalance(web3, envVars.WALLET_KEY, 1)
    )
  }

  // For some reason the process hangs here sometimes when using tor.
  process.exit()
}


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

go()
