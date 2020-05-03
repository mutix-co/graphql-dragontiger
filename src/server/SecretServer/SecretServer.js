const { JSONWebSecretBox, Base: { base58 }, Text } = require('jw25519');

function SecretServer(generator = () => ({})) {
  this.keys = new Map();
  this.generator = generator;
  return this;
}

SecretServer.prototype = {
  async getKey(id) {
    const keyId = id || 'LATEST_VERSION';

    if (this.keys.has(keyId)) {
      const key = this.keys.get(keyId);
      if (key.expireAt > Date.now()) return key;
    }

    const tmp = await this.generator(keyId);
    const key = {
      keyId: tmp.keyId || 'LATEST_VERSION',
      cryptor: new JSONWebSecretBox(tmp.secretKey),
      expireAt: tmp.expireAt || Date.now() + 48 * 60 * 60 * 1000,
    };
    this.keys.set(key.keyId, key);
    return key;
  },
  certificate() {
    return async (req, res) => {
      try {
        const { keyId, cryptor, expireAt } = await this.getKey();
        res.send({
          keyId,
          serverKey: base58.encode(cryptor.keyPair.publicKey),
          expireAt: new Date(expireAt).toISOString(),
        });
      } catch (error) {
        res.sendStatus(500);
      }
    };
  },
  express() {
    return async (req, res, next) => {
      try {
        const { body } = req;

        if (body.ciphertext === undefined) {
          next();
          return;
        }

        const key = await this.getKey(body.keyId);
        const clientKey = base58.decode(body.clientKey);

        const tmp = key.cryptor.decrypt(body.ciphertext, clientKey);
        req.body = JSON.parse(Text.convertUnicodeToString(tmp));

        const originalSend = res.send;
        res.send = (data) => {
          const content = typeof data === 'object' ? JSON.stringify(data) : data;
          if (typeof content === 'string') {
            const jwsb = new JSONWebSecretBox();
            const value = Text.convertStringToUnicode(content);
            const ciphertext = jwsb.encrypt(value, clientKey);
            res.set('Content-Type', 'application/json');
            return originalSend.call(res, JSON.stringify({
              ciphertext, serverKey: base58.encode(jwsb.keyPair.publicKey),
            }));
          }
          return originalSend.call(res, data);
        };

        next();
      } catch (error) {
        res.status(495).send('Body Certificate Error');
      }
    };
  },
};

module.exports = SecretServer;
