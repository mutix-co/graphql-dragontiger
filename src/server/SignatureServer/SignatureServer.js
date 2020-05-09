const assign = require('lodash/assign');
const defaults = require('lodash/defaults');
const { JSONWebSignature: JWS } = require('jw25519');

const step = 12 * 60 * 60;
const expire = 24 * 60 * 60;

function SignatureServer(secretKey) {
  this.cryptor = new JWS(secretKey);
}

SignatureServer.prototype = {
  generateUrl(payload) {
    return this.cryptor.sign({
      exp: Math.floor(Date.now() / 1000 / step) * step + expire,
      iat: undefined,
      sub: 'request-token',
      ...payload,
    });
  },
  generateBody(payload) {
    return this.cryptor.sign({
      sub: 'request-token',
      ...payload,
    });
  },
  express(option) {
    const { field, sub } = defaults(option, { field: 'ciphertext', sub: 'request-token' });
    return (req, res, next) => {
      try {
        const ciphertext = req.params[field] || req.body[field];
        const payload = this.cryptor.verify(ciphertext, { sub });
        assign(req.params, payload);
        assign(req.body, payload);
        next();
      } catch (e) {
        res.status(400).send('invalid signature');
      }
    };
  },
};

module.exports = SignatureServer;
