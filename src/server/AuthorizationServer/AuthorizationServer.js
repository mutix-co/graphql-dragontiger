const _ = require('lodash');
const crypto = require('crypto');
const { JSONWebSignature } = require('jw25519');
const { AuthenticationError } = require('apollo-server-errors');

function AuthorizationServer(key, options) {
  this.cryptor = new JSONWebSignature(key);

  _.assign(
    this,
    _.defaults(options, {
      expiresIn: 14 * 24 * 60 * 60,
      signInHandler: _.identity,
      signOutHandler: _.identity,
      reviewHandler: _.identity,
      errorHander: _.identity,
    }),
  );

  return this;
}

AuthorizationServer.prototype = {
  signRefresh(passport, ...args) {
    return this.sign(
      {
        sub: 'auth-refresh',
        exp: Math.floor(Date.now() / 1000) + this.expiresIn,
        passport,
      },
      ...args,
    );
  },
  signAccess(passport, ...args) {
    return this.sign(
      {
        sub: 'auth-access',
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        passport,
      },
      ...args,
    );
  },
  verifyRefresh(token, options) {
    const { passport } = this.verify(token, {
      sub: 'auth-refresh',
      ...options,
    });
    return passport;
  },
  verifyAccess(token, options) {
    if (!token) return {};
    const { passport } = this.verify(token, { sub: 'auth-access', ...options });
    return passport;
  },
  async signIn(params) {
    const passport = await this.signInHandler(params);
    const { correlationId } = params;

    if (process.env !== 'production') {
      _.forEach(passport, (value) => {
        if (_.includes(['boolean', 'string', 'number'], typeof value) === false) {
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
    const signature = this.verifyRefresh(params.refreshToken);
    const passport = await this.renewHandler({ ...params, ...signature });

    if (process.env !== 'production') {
      _.forEach(passport, (value) => {
        if (_.includes(['boolean', 'string', 'number'], typeof value) === false) {
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
      if (!_.includes(['signIn', 'signOut', 'renew'], action)) {
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
        const passport = await this.verifyAccess(token);
        return { ...context, passport };
      } catch (e) {
        this.errorHander(e);
        throw new AuthenticationError('token invalid');
      }
    };
  },
};

module.exports = AuthorizationServer;
