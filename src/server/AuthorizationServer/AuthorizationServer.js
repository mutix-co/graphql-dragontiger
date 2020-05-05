const assign = require('lodash/assign');
const identity = require('lodash/identity');
const forEach = require('lodash/forEach');
const includes = require('lodash/includes');
const crypto = require('crypto');
const { JSONWebSignature } = require('jw25519');
const { AuthenticationError } = require('apollo-server-errors');

const { NODE_ENV } = process.env;

function AuthorizationServer(key, options) {
  this.cryptor = new JSONWebSignature(key);

  assign(
    this,
    {
      expiresIn: 14 * 24 * 60 * 60,
      signInHandler: identity,
      signOutHandler: identity,
      reviewHandler: identity,
      errorHander: identity,
    },
    options,
  );

  return this;
}

AuthorizationServer.prototype = {
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

    if (process.env !== 'production') {
      forEach(passport, (value) => {
        if (includes(['boolean', 'string', 'number'], typeof value) === false) {
          throw new TypeError('passport must is boolean, string or number on sign-in');
        }
      });
    }

    const refreshToken = this.signRefresh({ ...passport, correlationId });
    const accessToken = this.signAccess({ ...passport, correlationId });
    return { ...passport, refreshToken, accessToken };
  },
  async signOut(params) {
    const passport = await this.signOutHandler(params);
    return passport;
  },
  async renew(params) {
    const { correlationId } = params;
    const { passport: signature } = this.verify(params.refreshToken, { sub: 'auth-refresh' });

    const passport = await this.renewHandler({ ...params, ...signature });

    if (NODE_ENV !== 'production') {
      forEach(passport, (value) => {
        if (includes(['boolean', 'string', 'number'], typeof value) === false) {
          throw new TypeError('passport must is boolean, string or number on renew');
        }
      });
    }

    const refreshToken = this.signRefresh({ ...passport, correlationId });
    const accessToken = this.signAccess({ ...passport, correlationId });
    return { ...passport, refreshToken, accessToken };
  },
  express() {
    return async (req, res) => {
      const { action } = req.body;
      if (includes(['signIn', 'signOut', 'renew'], action) === false) {
        res.sendStatus(404);
        return;
      }

      const correlationId = req.body.correlationId
        || req.get('x-correlation-id')
        || req.cookies['x-correlation-id']
        || crypto.randomBytes(16).toString('hex');

      try {
        const result = await this[action]({ ...req.body, correlationId });
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        res.cookie('x-correlation-id', correlationId, { expires, httpOnly: true });
        res.json({ ...result, status: 'ok', correlationId }).end();
      } catch (e) {
        this.errorHander(e);
        res.status(403).send({ error: e.message });
      }
    };
  },
  contextParser() {
    return async (context) => {
      const { req, connection } = context;

      let token;
      try {
        const { authorization } = connection ? connection.context : req.headers;
        [, token] = /^Bearer (.+)$/.exec(authorization);
      } catch (e) {
        // empty
      }

      try {
        if (token === undefined) return context;
        const { cryptor } = this;
        const { passport } = cryptor.verify(token, { sub: 'auth-access' });
        return { ...context, passport };
      } catch (e) {
        this.errorHander(e);
        throw new AuthenticationError('token invalid');
      }
    };
  },
};

module.exports = AuthorizationServer;
