const { post } = require('request-promise')
const _ = require('lodash')

module.exports = async (dvf, endpoint, data = {}) => {
  const url = dvf.config.wawet_api + endpoint

  console.log("Wawet api data: ");
  console.log(data);

  data = {
      ...data,
    }

  // removes null and undefined values
  data = _.omitBy(data, _.isNil)

  console.log("Wawet api: " + url);
  console.log(data);

  return post(url, { json: data })
}
