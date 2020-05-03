const get = require('lodash/get');

class NetworkError extends Error {
  constructor(response) {
    super();
    this.name = 'NetworkError';
    this.statusCode = 99;
    this.message = 'Connection refused';
    this.stacks = [];

    if (response) {
      this.statusCode = response.status;

      if (response.data.errors) {
        this.stacks = response.data.errors;
        this.message = 'GraphQL mixed errors';
      } else {
        this.message = response.statusText;
      }
    }
  }
}

NetworkError.isForbidden = (e) => get(e, ['statusCode']) === 403;

NetworkError.isOffline = (e) => get(e, ['statusCode']) === 99;

module.exports = NetworkError;
