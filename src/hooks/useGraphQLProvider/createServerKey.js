import { JSONWebSecretBox, codec, Text } from 'jw25519';
import debounce from '../../utils/debounce';

const { encode32, decode32 } = codec;

export default function createServerKey(client) {
  const { configs, cache, fetch } = client;
  const self = {
    getCryptor() {
      const { keyId, serverKey } = cache.get('server-key');
      const jwsb = new JSONWebSecretBox();
      return {
        encrypt(data) {
          const value = Text.convertStringToUnicode(JSON.stringify(data || {}));
          const clientKey = encode32(jwsb.keyPair.publicKey);
          const ciphertext = jwsb.encrypt(value, new Uint8Array(serverKey));
          return { keyId, clientKey, ciphertext };
        },
        decrypt(ciphertext, publicKey) {
          const value = jwsb.decrypt(ciphertext, decode32(publicKey));
          return JSON.parse(Text.convertUnicodeToString(value));
        },
      };
    },
    setServerKey(keyId, serverKey, expireAt) {
      cache.set('server-key', { keyId, serverKey }, expireAt);
    },
    async renew() {
      const { data } = await fetch({ url: configs.certificate });
      const { keyId, serverKey, expireAt } = data;
      this.setServerKey(keyId, [...decode32(serverKey)], new Date(expireAt).getTime());
    },
    check: debounce(async () => {
      if (cache.expired('server-key') === true) await self.renew();
    }),
  };

  return self;
}
