import fs from 'fs';
import http from 'http';
import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import SignatureServer from '..';
import SignatureSDK from '../../SignatureSDK';

const signatureServer = new SignatureServer(
  '61949dde6de8402e73f9a0251ca4542aba0e2c48b9297a9df61727ba892acddddc5f72b87838b88e834dedffc1977a74c42e59ccdfe4edd18026b7c5aa6972e1',
);

const app = express();
const server = http.createServer(app);
server.listen();
const { port } = server.address();

const handler = jest.fn((req, res) => res.sendStatus(200));

app.get('/params/:ciphertext', signatureServer.express(), handler);

app.get('/use/*', signatureServer.express(), handler);

app.post('/json', express.json(), signatureServer.express(), handler);

app.get('/get/:ciphertext', signatureServer.express(), handler);
app.delete('/delete/:ciphertext', signatureServer.express(), handler);
app.post('/post', express.json(), signatureServer.express(), handler);
app.put('/put', express.json(), signatureServer.express(), handler);
app.patch('/patch', express.json(), signatureServer.express(), handler);

const upload = multer();

app.post('/form', upload.any(), signatureServer.express(), handler);

const instance = axios.create({
  baseURL: `http://localhost:${port}`,
});

const sdk = new SignatureSDK(
  `http://localhost:${port}`,
  '61949dde6de8402e73f9a0251ca4542aba0e2c48b9297a9df61727ba892acddddc5f72b87838b88e834dedffc1977a74c42e59ccdfe4edd18026b7c5aa6972e1',
);

describe('SignatureServer', () => {
  afterAll(() => server.close());

  describe('generateUrl', () => {
    it('successfully get params', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      const ciphertext = signatureServer.generateUrl({ id });
      const result = await instance.get(`/params/${ciphertext}`);
      expect(result).toEqual(
        expect.objectContaining({
          status: 200,
          statusText: 'OK',
          config: expect.objectContaining({ url: `/params/${ciphertext}` }),
        }),
      );
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('successfully get use URL', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      const ciphertext = signatureServer.generateUrl({ id });
      const result = await instance.get(`/use/${ciphertext}`);
      expect(result).toEqual(
        expect.objectContaining({
          status: 200,
          statusText: 'OK',
          config: expect.objectContaining({ url: `/use/${ciphertext}` }),
        }),
      );
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('successfully use SDK', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      const result = await sdk.get('/params', { id });
      expect(result).toEqual(
        expect.objectContaining({ status: 200, statusText: 'OK' }),
      );
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('when verify failed', async () => {
      await expect(instance.get('/params/XYZ')).rejects.toEqual(
        new Error('Request failed with status code 400'),
      );
    });
  });

  describe('generateBody', () => {
    it('successfully get json', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      const ciphertext = signatureServer.generateBody({ id });
      const result = await instance.post('/json', { ciphertext });
      expect(result).toEqual(
        expect.objectContaining({ status: 200, statusText: 'OK' }),
      );
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('successfully use SDK', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      const result = await sdk.post('/json', { id });
      expect(result).toEqual(
        expect.objectContaining({ status: 200, statusText: 'OK' }),
      );
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('when verify failed on json', async () => {
      await expect(instance.post('/json', {})).rejects.toEqual(
        new Error('Request failed with status code 400'),
      );
    });

    it('successfully get formData', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      const form = new FormData();
      form.append('ciphertext', signatureServer.generateBody({ id }));
      form.append('file', fs.createReadStream(`${__dirname}/sample.jpg`));

      const result = await instance.post('/form', form, {
        headers: form.getHeaders(),
      });
      expect(result).toEqual(
        expect.objectContaining({ status: 200, statusText: 'OK' }),
      );
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('when verify failed on form', async () => {
      const form = new FormData();
      form.append('image', fs.createReadStream(`${__dirname}/sample.jpg`));
      form.append('video', fs.createReadStream(`${__dirname}/sample.jpg`));
      await expect(
        instance.post('/form', form, { headers: form.getHeaders() }),
      ).rejects.toEqual(new Error('Request failed with status code 400'));
    });
  });

  describe('http methods', () => {
    it('successfully get', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      await sdk.get('/get', { id });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('successfully delete', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      await sdk.delete('/delete', { id });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('successfully post', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      await sdk.post('/post', { id });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('successfully put', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      await sdk.put('/put', { id });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('successfully patch', async () => {
      const id = '2494ad2305c84e5d966b8864a94e89d6';
      await sdk.patch('/patch', { id });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({ id, sub: 'request-token' }),
        }),
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
