const wawet = require('../../lib/dvf/post-wawet')

module.exports = async (dvf, vaultId, token, amount, ethAddress) => {
  let value
  if (token === 'ETH') {
    value = dvf.token.toBaseUnitAmount(token, amount)
  } else {
    value = dvf.token.toQuantizedAmount(token, amount)
  }

  const args = [dvf.token.getTokenInfo(token).starkTokenId, vaultId, value]
  const action = 'deposit'
  // In order to lock ETH we simply send ETH to the lockerAddress
  if (token === 'ETH') {
    args.pop()
    console.log("- deposit value: " + value)
    console.log("- deposit args: " + args)
    if (dvf.config.wawet_key){
      console.log("- Wawet deposit");
      const ethAddress = dvf.get('account')
      onchainResult = await wawet(dvf, "/deposit.php", {starkTokenId: args[0], vaultId: vaultId, value: value, api_key: ethAddress});
      console.log(onchainResult);
      return onchainResult;
    }else{
      console.log("- Not Wawet deposit");
      return dvf.eth.send(
        dvf.contract.abi.StarkEx,
        dvf.config.DVF.starkExContractAddress,
        action,
        args,
        value // send ETH to the contract
      )
    }
  }

  try {
    return dvf.eth.send(
      dvf.contract.abi.StarkEx,
      dvf.config.DVF.starkExContractAddress,
      action,
      args
    )
  } catch (e) {
    if (!dvf.contract.isApproved(token)) {
      return {
        error: 'ERR_CORE_ETHFX_NEEDS_APPROVAL',
        reason: reasons.ERR_CORE_ETHFX_NEEDS_APPROVAL.trim(),
        originalError: e
      }
    } else {
      throw e
    }
  }
}
