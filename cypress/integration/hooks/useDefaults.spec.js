context('useDefaults', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6060/#/hooks/useDefaults');
  });

  it('successfully', () => {
    cy.get('[data-testid="Example-useDefaults"]').as('example');
    cy.get('@example').find('[data-testid="Value-isSame"]').as('result');
    cy.get('@example').find('[data-testid="Value-Value"]').as('value');
    cy.get('@example').find('[name="increment"]').as('increment');
    cy.get('@example').find('[name="no-change"]').as('no-change');

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
