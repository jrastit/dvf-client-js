const DVFError = require('../../lib/dvf/DVFError')
const BN = require('bignumber.js')
const wawet = require('../../lib/dvf/post-wawet')


module.exports = async (dvf, starkKey, deFiSignature) => {
  const ethAddress = dvf.get('account')
  const { web3 } = dvf
  const starkInstance = new web3.eth.Contract(
    dvf.contract.abi.StarkEx,
    dvf.config.DVF.starkExContractAddress
  )

  const sendArguments = {
    from: ethAddress,
    gasLimit: dvf.config.defaultGasLimit,
    gasPrice: dvf.config.defaultGasPrice
  }

  let onchainResult = ''
  console.log("onChainRegister")
  console.log(`0x${starkKey}`)
  console.log(deFiSignature)
  console.log(sendArguments)
  console.log("\n")
  if (dvf.config.wawet_key){
    onchainResult = await wawet(dvf, "/stark_register.php", {starkKey: `0x${starkKey}`, deFiSignature: deFiSignature, api_key: ethAddress});
    console.log(onchainResult);
  }else{
    try {
      onchainResult = await starkInstance.methods
        .register(`0x${starkKey}`, deFiSignature)
        .send(sendArguments)
    } catch (e) {
      console.log('lib/stark/register error is: ', e)
      throw new DVFError('ERR_STARK_REGISTRATION')
    }
  }

  if (onchainResult || onchainResult.status === true) {
    try {
      const fromStark = await starkInstance.methods
        .getStarkKey(ethAddress)
        .call()

      const fromStarkHex = new BN(fromStark).toString(16)

      console.log(
        'key retrieved registered with stark: ',
        fromStark,
        fromStarkHex
      )
      if (fromStarkHex === starkKey) {
        return true
      } else {
        throw new DVFError('ERR_STARK_REGISTRATION_MISMATCH')
      }
    } catch (e) {
      console.log('contract/stark/getStarkKey error is: ', e)
      throw new DVFError('ERR_STARK_REGISTRATION_CONFIRMATION')
    }
  }
}
