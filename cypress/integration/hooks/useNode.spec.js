context('useNode', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6060/#/hooks/useNode');
  });

  it('successfully', () => {
    cy.get('[data-testid="useNode-with-query-example"]').as('example');
  });
});
