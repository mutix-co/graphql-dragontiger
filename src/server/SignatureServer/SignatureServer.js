const defaults = require('lodash/defaults');
const { JSONWebSignature: JWS, base16 } = require('jw25519');

function SignatureServer(secretKey) {
  this.cryptor = new JWS(base16.decode(secretKey));
}

SignatureServer.prototype = {
  generateUrl(payload, expire = 60 * 60) {
    const { cryptor } = this;
    const block = expire / 2;
    return cryptor.sign({
      exp: Math.floor(Date.now() / 1000 / block) * block + expire,
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
  verify(ciphertext, sub) {
    return this.cryptor.verify(ciphertext, { sub });
  },
  express(option) {
    const { field, sub } = defaults(option, { field: 'ciphertext', sub: 'request-token' });
    return (req, res, next) => {
      try {
        const { url, params = {}, body = {} } = req;
        const ciphertext = params[field] || body[field] || url.substring(url.lastIndexOf('/') + 1);
        const payload = this.cryptor.verify(ciphertext, { sub });
        req.signature = { ...payload, ciphertext };
        next();
      } catch (e) {
        res.status(400).send('invalid signature');
      }
    };
  },
};

module.exports = SignatureServer;
