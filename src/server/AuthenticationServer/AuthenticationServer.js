const assign = require('lodash/assign');
const identity = require('lodash/identity');
const includes = require('lodash/includes');
const crypto = require('crypto');
const cookie = require('cookie');
const { JSONWebSignature: JWS, codec } = require('jw25519');
const { AuthenticationError } = require('apollo-server-errors');

const { decode16 } = codec;

function AuthenticationServer(secretKey, options) {
  this.cryptor = new JWS(decode16(secretKey));

  assign(
    this,
    {
      expiresIn: 14 * 24 * 60 * 60,
      signInHandler: identity,
      signOutHandler: identity,
      renewHandler: identity,
      errorHander: identity,
      generateCorrelation() {
        return crypto.randomBytes(16).toString('hex');
      },
    },
    options,
  );

  return this;
}

function parseHeaders(req) {
  return {
    ip: req.get('cf-connecting-ip'),
    country: req.get('cf-ipcountry'),
    userAgent: req.get('user-agent'),
  };
}

AuthenticationServer.prototype = {
  signRefresh(passport) {
    const { cryptor } = this;
    return cryptor.sign({
      sub: 'auth-refresh',
      exp: Math.floor(Date.now() / 1000) + this.expiresIn,
      passport,
    });
  },
  signAccess(passport) {
    const { cryptor } = this;
    return cryptor.sign({
      sub: 'auth-access',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      passport,
    });
  },
  async signIn(params) {
    const passport = await this.signInHandler(params);
    const { correlationId } = params;
    const refreshToken = this.signRefresh({ ...passport, correlationId });
    const accessToken = this.signAccess({ ...passport, correlationId });
    return { refreshToken, accessToken };
  },
  async signOut(params) {
    const passport = await this.signOutHandler(params);
    return passport;
  },
  async renew(params) {
    const { cryptor } = this;
    const { correlationId } = params;
    const { passport: signature } = cryptor.verify(params.refreshToken, { sub: 'auth-refresh' });

    if (signature.correlationId !== correlationId) {
      throw AuthenticationError('correlation invalid');
    }

    const passport = await this.renewHandler({ ...params, ...signature });
    const refreshToken = this.signRefresh({ ...passport, correlationId });
    const accessToken = this.signAccess({ ...passport, correlationId });
    return { refreshToken, accessToken };
  },
  express() {
    return async (req, res) => {
      const { action } = req.body;
      if (includes(['signIn', 'signOut', 'renew'], action) === false) {
        res.sendStatus(404);
        return;
      }

      const cookies = cookie.parse(req.headers.cookie || '');
      let correlationId = req.body.correlationId
        || req.get('x-correlation-id')
        || cookies['x-correlation-id'];
      if (/^[0-9a-f]{32}$/i.test(correlationId) === false) {
        correlationId = this.generateCorrelation();
      }

      const headers = {
        correlationId,
        ...parseHeaders(req),
      };

      try {
        const result = await this[action]({ ...req.body, ...headers });
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        res.cookie('x-correlation-id', correlationId, { expires, httpOnly: true });
        res.json({ ...result, status: 'ok', correlationId }).end();
      } catch (error) {
        this.errorHander(error, { headers, correlationId });
        res.status(401).send({ error: error.message });
      }
    };
  },
  parseToken(authorization) {
    let token;
    try {
      [, token] = /^Bearer (.+)$/.exec(authorization);
    } catch (error) {
      // empty
    }
    try {
      if (token === undefined) return undefined;
      const { passport } = this.cryptor.verify(token, { sub: 'auth-access' });
      return passport;
    } catch (error) {
      throw new AuthenticationError('token invalid');
    }
  },
  expressParser() {
    return async (req, res, next) => {
      try {
        req.passport = this.parseToken(req.get('authorization'));
        next();
      } catch (error) {
        this.errorHander(error, { headers: parseHeaders(req) });
        res.status(401).send({ error: 'token invalid' });
      }
    };
  },
  connectParser() {
    return (connectionParams) => {
      const passport = this.parseToken(connectionParams.authorization);
      return { passport };
    };
  },
  apolloContext({ req, connection }) {
    if (connection) {
      return connection.context || {};
    }

    const { passport } = req;
    return {
      passport,
      ...parseHeaders(req),
    };
  },
};

module.exports = AuthenticationServer;
