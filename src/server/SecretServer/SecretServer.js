const { JSONWebSecretBox, TextArray } = require('jw25519');

function SecretServer(key) {
  this.cryptor = new JSONWebSecretBox(key);
  return this;
}

SecretServer.prototype = {
  express() {
    return (req, res, next) => {
      const { body } = req;
      const { send } = res;

      if (body.ciphertext === undefined) {
        next();
        return;
      }

      try {
        req.body = this.cryptor.decrypt(body.ciphertext, body.key);

        res.send = (data) => {
          const jwsb = JSONWebSecretBox();
          const ciphertext = jwsb.encrypt(
            TextArray.convertStringToUTF16(JSON.stringify(data)),
            body.key,
          );
          send({ ciphertext, key: jwsb.keyPair.publicKey });
        };

        next();
      } catch (error) {
        res.status(495).send('Body Certificate Error');
      }
    };
  },
};

module.exports = SecretServer;
