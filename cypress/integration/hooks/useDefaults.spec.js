context('useDefaults', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6060/#/hooks/useDefaults');
  });

  it('successfully', () => {
    cy.get('[data-testid="useDefaults-example-0"]').as('component');
    cy.get('@component').find('[data-testid="result"]').as('result');
    cy.get('@component').find('[data-testid="value"]').as('value');
    cy.get('@component').find('[data-testid="increment"]').as('increment');
    cy.get('@component').find('[data-testid="no-change"]').as('no-change');

    cy.get('@result').should('contain', 'no 0');

    cy.get('@increment').click();

    cy.get('@value').should('contain', '2');
    cy.get('@result').should('contain', 'no 1');

    cy.get('@no-change').click();

    cy.get('@value').should('contain', '2');
    cy.get('@result').should('contain', 'yes 2');

    cy.get('@no-change').click();

    cy.get('@value').should('contain', '2');
    cy.get('@result').should('contain', 'yes 3');

    cy.get('@increment').click();

    cy.get('@value').should('contain', '3');
    cy.get('@result').should('contain', 'no 4');
  });
});
