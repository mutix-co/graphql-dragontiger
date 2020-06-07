/* eslint-disable jest/no-try-expect */

import http from 'http';
import express from 'express';
import gql from 'graphql-tag';
import axios from 'axios';
import ws from 'ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { ApolloServer, PubSub, withFilter } from 'apollo-server-express';
import formatError from '../../../utils/formatError';
import AuthorizationServer from '..';

const signInHandler = jest.fn((v) => Promise.resolve(v));
const signOutHandler = jest.fn((v) => Promise.resolve(v));
const renewHandler = jest.fn((v) => Promise.resolve(v));
const errorHander = jest.fn((v) => Promise.resolve(v));
const resolve = jest.fn(() => 1);

const authorization = new AuthorizationServer(
  '61949dde6de8402e73f9a0251ca4542aba0e2c48b9297a9df61727ba892acddddc5f72b87838b88e834dedffc1977a74c42e59ccdfe4edd18026b7c5aa6972e1', {
    signInHandler,
    signOutHandler,
    renewHandler,
    errorHander,
  },
);

const pubsub = new PubSub();

const app = express();
const server = http.createServer(app);
server.listen();
const { port } = server.address();

app.use(express.json());

app.use(authorization.expressParser());

app.post('/authorization', authorization.express());

app.post('/api', resolve);

const apolloServer = new ApolloServer({
  typeDefs: gql`
    type Query { post: Int }
    type Subscription { postAdded: Int }
  `,
  resolvers: {
    Query: { post: (source, args, context) => resolve(context) },
    Subscription: {
      postAdded: {
        resolve(source) {
          return source;
        },
        subscribe: withFilter(
          () => pubsub.asyncIterator(['NEW_SUBSCRIPTION']),
          (source, args, context) => {
            resolve(context);
            return true;
          },
        ),
      },
    },
  },
  subscriptions: { onConnect: authorization.connectParser() },
  context: authorization.apolloContext,
  formatError,
});
apolloServer.applyMiddleware({ app });
apolloServer.installSubscriptionHandlers(server);

const instance = axios.create({
  baseURL: `http://localhost:${port}`,
});

describe('AuthorizationServer', () => {
  afterAll(() => server.close());

  describe('express', () => {
    it('not found method', async () => {
      await expect(
        instance.post('/authorization', { action: 'notfnoud' }),
      ).rejects.toEqual(new Error('Request failed with status code 404'));
    });

    let correlationId;
    describe('signIn', () => {
      it('successfully signIn', async () => {
        signInHandler.mockReturnValueOnce({ userId: '10' });
        const body = { username: 'apple', password: 'applepen' };
        const result = await instance.post('/authorization', { ...body, action: 'signIn' });
        const { data, headers } = result;
        expect(data.refreshToken).not.toBeUndefined();
        expect(data.accessToken).not.toBeUndefined();
        expect(data.userId).toBe('10');
        expect(signInHandler).toHaveBeenCalledTimes(1);
        expect(signInHandler).toHaveBeenCalledWith({
          action: 'signIn',
          headers: expect.objectContaining({
            correlationId: expect.stringMatching(/^[0-9a-f]{32}$/),
            userAgent: expect.stringMatching(/^axios/),
          }),
          ...body,
        });
        expect(headers['set-cookie'][0]).toMatch(/^x-correlation-id=/i);
        [, correlationId] = /^x-correlation-id=([0-9a-f]+)/i.exec(headers['set-cookie'][0]);
      });

      it('successfully signIn with correlationId', async () => {
        signInHandler.mockReturnValueOnce({ userId: '10' });
        const body = { username: 'apple', password: 'applepen' };
        const result = await instance.post(
          '/authorization',
          { ...body, action: 'signIn' },
          { headers: { Cookie: `x-correlation-id=${correlationId}` } },
        );
        const { data, headers } = result;
        expect(data.refreshToken).not.toBeUndefined();
        expect(data.accessToken).not.toBeUndefined();
        expect(data.userId).toBe('10');
        expect(signInHandler).toHaveBeenCalledTimes(1);
        expect(signInHandler).toHaveBeenCalledWith({
          action: 'signIn',
          headers: expect.objectContaining({
            correlationId: expect.stringMatching(/^[0-9a-f]{32}$/),
            userAgent: expect.stringMatching(/^axios/),
          }),
          ...body,
        });
        expect(headers['set-cookie'][0]).toMatch(/^x-correlation-id=/i);
        expect(
          /^x-correlation-id=([0-9a-f]+)/i.exec(headers['set-cookie'][0])[1],
        ).toBe(correlationId);
      });

      it('when invalid correlation id', async () => {
        signInHandler.mockReturnValueOnce({ userId: '10' });
        const body = { username: 'apple', password: 'applepen' };
        const result = await instance.post(
          '/authorization',
          { ...body, action: 'signIn' },
          { headers: { Cookie: 'x-correlation-id=XXYYZZ' } },
        );
        const { data, headers } = result;
        expect(data.refreshToken).not.toBeUndefined();
        expect(data.accessToken).not.toBeUndefined();
        expect(data.userId).toBe('10');
        expect(signInHandler).toHaveBeenCalledTimes(1);
        expect(signInHandler).toHaveBeenCalledWith({
          action: 'signIn',
          headers: expect.objectContaining({
            correlationId: expect.stringMatching(/^[0-9a-f]{32}$/),
            userAgent: expect.stringMatching(/^axios/),
          }),
          ...body,
        });
        expect(
          /^x-correlation-id=([0-9a-f]+)/i.exec(headers['set-cookie'][0])[1],
        ).not.toBe('XXYYZZ');
      });

      it('when sign-in failed', async () => {
        expect.assertions(6);
        signInHandler.mockRejectedValueOnce(new Error('Two-factor Authentication is required'));
        try {
          await instance.post('/authorization', { action: 'signIn' });
        } catch (err) {
          const { response: res } = err;
          expect(err).toEqual(new Error('Request failed with status code 401'));
          expect(res.data.error).toBe('Two-factor Authentication is required');
          expect(res.data.refreshToken).toBeUndefined();
          expect(res.data.accessToken).toBeUndefined();
        }
        expect(signInHandler).toHaveBeenCalledTimes(1);
        expect(signInHandler).toHaveBeenCalledWith({
          action: 'signIn',
          headers: expect.objectContaining({
            correlationId: expect.stringMatching(/^[0-9a-f]{32}$/),
            userAgent: expect.stringMatching(/^axios/),
          }),
        });
      });
    });

    describe('signOut', () => {
      it('successfully signOut', async () => {
        signOutHandler.mockReturnValueOnce({});
        const result = await instance.post('/authorization', { action: 'signOut' });
        const { data, headers } = result;
        expect(data.status).toBe('ok');
        expect(signOutHandler).toHaveBeenCalledTimes(1);
        expect(signOutHandler).toHaveBeenCalledWith({
          action: 'signOut',
          headers: expect.objectContaining({
            correlationId: expect.stringMatching(/^[0-9a-f]{32}$/),
            userAgent: expect.stringMatching(/^axios/),
          }),
        });
        expect(headers['set-cookie'][0]).toMatch(/^x-correlation-id=/i);
      });
    });

    describe('renew', () => {
      it('successfully renew token', async () => {
        renewHandler.mockReturnValueOnce({ userId: 10, isAdmin: true });
        const refreshToken = authorization.signRefresh({ userId: 10 });
        const result = await instance.post(
          '/authorization',
          { refreshToken, action: 'renew' },
          { headers: { Cookie: `x-correlation-id=${correlationId}` } },
        );
        const { data, headers } = result;
        expect(data.accessToken).not.toBeUndefined();
        expect(data.userId).toBe(10);
        expect(data.isAdmin).toBe(true);
        expect(renewHandler).toHaveBeenCalledTimes(1);
        expect(renewHandler).toHaveBeenCalledWith({
          action: 'renew',
          userId: 10,
          refreshToken,
          headers: expect.objectContaining({
            correlationId: expect.stringMatching(/^[0-9a-f]{32}$/),
            userAgent: expect.stringMatching(/^axios/),
          }),
        });
        expect(
          /^x-correlation-id=([0-9a-f]+)/i.exec(headers['set-cookie'][0])[1],
        ).toBe(correlationId);
      });

      it('when invalid token', async () => {
        expect.assertions(4);
        const refreshToken = authorization.signAccess({ userId: 10 });
        try {
          await instance.post(
            '/authorization',
            { refreshToken, action: 'renew' },
            { headers: { Cookie: `x-correlation-id=${correlationId}` } },
          );
        } catch (err) {
          const { response: res } = err;
          expect(err).toEqual(new Error('Request failed with status code 401'));
          expect(res.data.error).toBe('subject not matched');
          expect(res.data.refreshToken).toBeUndefined();
          expect(res.data.accessToken).toBeUndefined();
        }
      });

      it('when reject renew', async () => {
        expect.assertions(4);
        renewHandler.mockRejectedValueOnce(new Error('not match to country'));
        const refreshToken = authorization.signRefresh({ userId: 10 });
        try {
          await instance.post(
            '/authorization',
            { refreshToken, action: 'renew' },
            { headers: { Cookie: `x-correlation-id=${correlationId}` } },
          );
        } catch (err) {
          const { response: res } = err;
          expect(err).toEqual(new Error('Request failed with status code 401'));
          expect(res.data.error).toBe('not match to country');
          expect(res.data.refreshToken).toBeUndefined();
          expect(res.data.accessToken).toBeUndefined();
        }
      });
    });
  });

  describe('contextParser', () => {
    describe('http', () => {

    });

    describe('graphql', () => {
      it('successfully get guest', async () => {
        const { data } = await instance.post('/graphql', { query: 'query { post }' });
        expect(data.data).toEqual({ post: 1 });
        expect(resolve).not.toHaveBeenCalledWith(
          expect.objectContaining({ passport: expect.anything() }),
        );
        expect(resolve).toHaveBeenCalledTimes(1);
      });

      it('successfully get user', async () => {
        const token = authorization.signAccess({ id: '1' });
        const { data } = await instance.post(
          '/graphql',
          { query: 'query { post }' },
          { headers: { authorization: `Bearer ${token}` } },
        );

        expect(data.data).toEqual({ post: 1 });
        expect(resolve).toHaveBeenCalledWith(
          expect.objectContaining({ passport: { id: '1' } }),
        );
      });

      it('when token is invalid', async () => {
        expect.assertions(2);
        const token = authorization.signRefresh({ id: '1' });
        try {
          await instance.post(
            '/graphql',
            { query: 'query { post }' },
            { headers: { authorization: `Bearer ${token}` } },
          );
        } catch (err) {
          const { response: res } = err;
          expect(err).toEqual(new Error('Request failed with status code 401'));
          expect(res.data.error).toBe('token invalid');
        }
      });
    });

    describe('subscription', () => {
      it('successfully get guest', async () => {
        expect.assertions(2);
        const wsClient = new SubscriptionClient(`ws://localhost:${port}/graphql`, {
          reconnect: true,
          connectionParams: {},
        }, ws);
        const observable = wsClient.request({
          query: 'subscription { postAdded }',
        });

        const promise = new Promise((res, rej) => {
          const { unsubscribe } = observable.subscribe({
            next(value) {
              res(value);
              unsubscribe();
            },
            error: rej,
          });
        });
        await new Promise((r) => setTimeout(r, 1000));
        pubsub.publish('NEW_SUBSCRIPTION', 9);
        expect(await promise).toEqual({ data: { postAdded: 9 } });
        expect(resolve).toHaveBeenCalledWith({ passport: undefined });
      });

      it('successfully get user', async () => {
        expect.assertions(2);
        const wsClient = new SubscriptionClient(`ws://localhost:${port}/graphql`, {
          reconnect: true,
          connectionParams() {
            const token = authorization.signAccess({ userId: 10 });
            return { authorization: `Bearer ${token}` };
          },
        }, ws);
        const observable = wsClient.request({
          query: 'subscription { postAdded }',
        });

        const promise = new Promise((res, rej) => {
          const { unsubscribe } = observable.subscribe({
            next(value) {
              res(value);
              unsubscribe();
            },
            error: rej,
            complete() { unsubscribe(); },
          });
        });
        await new Promise((r) => setTimeout(r, 1000));
        pubsub.publish('NEW_SUBSCRIPTION', 9);
        expect(await promise).toEqual({ data: { postAdded: 9 } });
        expect(resolve).toHaveBeenCalledWith({ passport: { userId: 10 } });
      });

      it('when token is invalid', async () => {
        expect.assertions(1);
        const wsClient = new SubscriptionClient(`ws://localhost:${port}/graphql`, {
          reconnect: true,
          connectionParams() {
            return { authorization: 'Bearer XXXYYYZZ' };
          },
        }, ws);
        const observable = wsClient.request({
          query: 'subscription { postAdded }',
        });

        const promise = new Promise((res, rej) => {
          const { unsubscribe } = observable.subscribe({
            next(value) {
              res(value);
              unsubscribe();
            },
            error: rej,
            complete() { unsubscribe(); },
          });
        });
        await expect(promise).rejects.toEqual({
          message: 'token invalid',
        });
      });
    });
  });
});
