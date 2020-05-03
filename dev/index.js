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
    false: console.log,
  },
  ignore: ['**/__tests__/**', '**/__mocks__/**', '**/index.js'],
  pagePerSection: true,
  styles: {
    StyleGuide: {
      '@global body > iframe': { display: 'none' },
    },
  },
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
      name: 'useDefaults',
      content: `${root}/hooks/useDefaults/useDefaults.md`,
    }, {
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
      name: 'useNode',
      content: `${root}/hooks/useNode/useNode.md`,
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

    const secret = new SecretServer(() => ({
      secretKey: new Uint8Array([
        82, 181, 154, 119, 181, 69, 37, 175, 6, 221, 182, 153, 169, 125, 234, 136,
        88, 166, 128, 49, 216, 23, 206, 42, 155, 223, 42, 245, 126, 200, 187, 12,
      ]),
      expireAt: 100,
    }));
    app.use('/certificate', secret.certificate());
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
