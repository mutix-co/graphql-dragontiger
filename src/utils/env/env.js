/* eslint-disable no-underscore-dangle */

const { Base } = require('jw25519');
const window = require('global/window');
const isBrowser = require('../isBrowser');

const { base58 } = Base;

if (isBrowser && typeof window.__ENV__ === 'string') {
  const data = base58.decode(window.__ENV__).toString();
  window.__ENV__ = JSON.parse(data);
}

module.exports = (isBrowser ? window.__ENV__ : process.env) || {};
