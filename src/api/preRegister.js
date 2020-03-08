const { post } = require('request-promise')
const validateAssertions = require('../lib/validators/validateAssertions')

module.exports = async (dvf, starkPublicKey) => {
  let ethAddress;
  if (dvf.config.wawet_key){
    ethAddress = dvf.config.wawet_key;
  }else{
    ethAddress = dvf.get('account')
  }
  validateAssertions(dvf, { starkPublicKey })

  const url = dvf.config.api + '/v1/trading/w/preRegister'
  const data = {
    starkKey: starkPublicKey.x,
    ethAddress
  }
  return post(url, { json: data })
}
