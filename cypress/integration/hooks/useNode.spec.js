context('useNode', () => {
  beforeEach(() => {
    cy.window().then((win) => { win.sessionStorage.clear(); });
    cy.visit('http://localhost:6060/#/hooks/useNode');
  });

  it('update from mutation', () => {
    cy.get('[data-testid="useNode-update-from-mutation-example"]').as('example');
    cy.get('@example').find('[data-testid=query]').should('contain', 'Tag 01');
    cy.get('@example').find('[data-testid=mutation] input').type('New word');
    cy.get('@example').find('[data-testid=mutation] button').click();
    cy.get('@example').find('[data-testid=query]').should('contain', 'New word');
  });

  it('update from query', () => {
    cy.get('[data-testid="useNode-update-from-query-example"]').as('example');
    cy.get('@example').find('[data-testid=TAG_01]').should('contain', 'Tag 01');
    cy.get('@example').find('[data-testid=TAG_02]').should('contain', 'loading...');
    cy.get('@example').find('[data-testid=fetch] button').click();
    cy.get('@example').find('[data-testid=TAG_01]').should('contain', 'Tag 01');
    cy.get('@example').find('[data-testid=TAG_02]').should('contain', 'Tag 02');
  });
});
