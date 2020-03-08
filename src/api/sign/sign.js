/**
 * Signs toSign assyncronously
 *
 * For more information, check:
 * https://web3js.readthedocs.io/en/1.0/web3-eth.html#sign
 */
const wawet = require('../../lib/dvf/post-wawet')

module.exports = (dvf, toSign) => {
  // metamask will take care of the 3rd parameter, "password"
  console.log('To sign ' + toSign)
  if (dvf.config.wawet_key){
    return wawet(dvf, "/sign.php", {toSign : toSign, api_key : dvf.config.wawet_key})
  }else if (dvf.web3.currentProvider.isMetaMask) {
    return dvf.web3.eth.personal.sign(toSign, dvf.get('account'))
  } else {
    return dvf.web3.eth.sign(toSign, dvf.get('account'))
  }
}
