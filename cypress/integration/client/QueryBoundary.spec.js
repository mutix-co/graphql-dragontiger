context('QueryBoundary', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6060/#/client/QueryBoundary');
  });

  it('succeed', () => {
    cy.on('uncaught:exception', (err) => {
      expect(err.message).include('query error');
      return false;
    });
    cy.get('[data-testid="QueryBoundary-example-0"]').as('example');
    cy.get('@example').find('[data-testid="succeed"]').click();
    cy.get('@example').should('contain', 'loading...');
    cy.get('@example').should('contain', 'Count: 1');
    cy.get('@example').find('[data-testid="failed"]').click();
    cy.get('@example').should('contain', 'loading...');
    cy.get('@example').find('[data-testid="retry"]').click();
    cy.get('@example').should('contain', 'Count: 0');
  });
});
