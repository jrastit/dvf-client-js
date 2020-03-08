module.exports = {
  // api: 'https://api.deversifi.com',
  api: 'https://api.deversifi.dev',
  wawet_api: 'https://api.wawet.com/deversifi',
  //wawet_api: 'http://api.wawet.localhost/deversifi',
  wawet_key: 0,

  // default transaction arguments
  defaultGasLimit: 200000,
  defaultGasPrice: 14000000000,
  // default expiration time for orders in hours, used by create_order.js
  defaultStarkExpiry: 720,
  // default nonce age in seconds
  defaultNonceAge: 10800,
  // in case no provider is provided we will try connecting to the this default
  // address
  defaultProvider: 'http://localhost:8545',

  // default account to select in case no account is provided by the userConfig
  // parameter
  account: 0,

  // enables integrators to select if they want to fetch user config upon initialization
  autoLoadUserConf: true
}
