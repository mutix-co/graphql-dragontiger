import { authenticator } from 'otplib';

context('TOTPQRCode', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6060/#/client/TOTPQRCode');
  });

  it('successfully', () => {
    const stub = cy.stub();
    cy.on('window:alert', stub);

    cy.get('[data-testid="Example-TOTPQRCode"]').as('example');
    cy.get('@example').find('.secret').invoke('text').then((secret) => {
      const token = authenticator.generate(secret);
      cy.get('@example').find('input').type(token);
    });
    cy.get('@example').find('button').click().then(() => {
      expect(stub.getCall(0)).to.be.calledWith(true);
    });
  });

  it('failed', () => {
    const stub = cy.stub();
    cy.on('window:alert', stub);

    cy.get('[data-testid="Example-TOTPQRCode"]').as('example');
    cy.get('@example').find('input').type('XXXXXX');
    cy.get('@example').find('button').click().then(() => {
      expect(stub.getCall(0)).to.be.calledWith(false);
    });
  });
});
