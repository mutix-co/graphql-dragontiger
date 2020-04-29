/* eslint-disable no-console */

const path = require('path');
const styleguidist = require('react-styleguidist');
const express = require('express');
const fetcher = require('./fetcher');
const apollo = require('./apollo');
const uploader = require('./uploader');
const SecretServer = require('../src/server/SecretServer/SecretServer');

const root = path.resolve(`${__dirname}/../src/`);

const styleguide = styleguidist({
  logger: {
    warn: console.warn,
    info: console.log,
    debug: console.log,
  },
  ignore: ['**/__tests__/**', '**/__mocks__/**', '**/index.js'],
  pagePerSection: true,
  usageMode: 'expand',
  sections: [{
    name: 'utils',
    sectionDepth: 1,
    sections: [{
      name: 'env',
      content: `${root}/utils/env/env.md`,
    }, {
      name: 'getFieldName',
      content: `${root}/utils/getFieldName/getFieldName.md`,
    }, {
      name: 'isBrowser',
      content: `${root}/utils/isBrowser/isBrowser.md`,
    }],
  }, {
    name: 'client',
    sectionDepth: 1,
    components: `${root}/client/**/[A-Z]*.js`,
  }, {
    name: 'hooks',
    sectionDepth: 1,
    sections: [{
      name: 'useGraphQLProvider',
      content: `${root}/hooks/useGraphQLProvider/useGraphQLProvider.md`,
    }, {
      name: 'useGraphQLClient',
      content: `${root}/hooks/useGraphQLClient/useGraphQLClient.md`,
    }, {
      name: 'useGraphQLUser',
      content: `${root}/hooks/useGraphQLUser/useGraphQLUser.md`,
    }, {
      name: 'useQuery',
      content: `${root}/hooks/useQuery/useQuery.md`,
    }, {
      name: 'usePagination',
      content: `${root}/hooks/usePagination/usePagination.md`,
    }, {
      name: 'useMutation',
      content: `${root}/hooks/useMutation/useMutation.md`,
    }, {
      name: 'useSubscription',
      content: `${root}/hooks/useSubscription/useSubscription.md`,
    }],
  }, {
    name: 'server',
    sectionDepth: 1,
    sections: [{
      name: 'AuthorizationServer',
      content: `${root}/server/AuthorizationServer/AuthorizationServer.md`,
    }, {
      name: 'SecretServer',
      content: `${root}/server/SecretServer/SecretServer.md`,
    }],
  }],
  webpackConfig: {
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
      ],
    },
  },
  styleguideComponents: {
    Wrapper: path.join(__dirname, '/Wrapper'),
  },
  configureServer(app) {
    app.use(express.json());

    const secret = new SecretServer();
    app.use(secret.express());

    [fetcher, apollo, uploader].forEach((server) => server({ app }));
  },
});

styleguide.server(
  (err, config) => {
    if (err) {
      console.log(err);
    } else {
      const url = `http://localhost:${config.serverPort}`;
      console.log(`Listening at ${url}`);
    }
  },
);
