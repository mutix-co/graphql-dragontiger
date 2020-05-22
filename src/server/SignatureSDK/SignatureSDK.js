const axios = require('axios');
const SignatureServer = require('../SignatureServer');

function SignatureSDK(url, secretKey) {
  this.cryptor = typeof secretKey === 'string' ? new SignatureServer(secretKey) : secretKey;
  this.instance = axios.create({ baseURL: url });
  return this;
}

SignatureSDK.prototype = {
  get(url, data, config) {
    const token = this.cryptor.generateUrl(data);
    return this.instance.get(`${url}/${token}`, config);
  },
  delete(url, data, config) {
    const token = this.cryptor.generateUrl(data);
    return this.instance.delete(`${url}/${token}`, config);
  },
  post(url, data, config) {
    const ciphertext = this.cryptor.generateBody(data);
    return this.instance.post(url, { ciphertext }, config);
  },
  put(url, data, config) {
    const ciphertext = this.cryptor.generateBody(data);
    return this.instance.put(url, { ciphertext }, config);
  },
  patch(url, data, config) {
    const ciphertext = this.cryptor.generateBody(data);
    return this.instance.patch(url, { ciphertext }, config);
  },
};

module.exports = SignatureSDK;
