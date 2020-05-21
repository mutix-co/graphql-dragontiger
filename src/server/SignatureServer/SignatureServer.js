const assign = require('lodash/assign');
const defaults = require('lodash/defaults');
const { JSONWebSignature: JWS, base16 } = require('jw25519');

const { SIGNATURE_SECRET_KEY } = process.env;

function SignatureServer(secretKey = SIGNATURE_SECRET_KEY, expire = 60 * 60) {
  this.cryptor = new JWS(base16.decode(secretKey));
  this.expire = expire;
}

SignatureServer.prototype = {
  generateUrl(payload) {
    const { cryptor, expire } = this;
    return cryptor.sign({
      exp: Math.floor(Date.now() / 1000 / expire) * expire + (expire * 2),
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
