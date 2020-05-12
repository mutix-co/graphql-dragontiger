context('useMutation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6060/#/hooks/useMutation');
  });

  it('finish', () => {
    cy.get('[data-testid="Example-finish"]').as('example');
    cy.get('@example').find('button').as('button');
    cy.get('@example').find('[data-testid="Value-mark"] [data-testid="value"]').as('mark');
    cy.get('@example').find('[data-testid="Value-state"] [data-testid="value"]').as('state');

    cy.get('@button').click();

    cy.get('@state').should('text', 'processing');

    cy.get('@mark').should('not.text', '0');
    cy.get('@mark').invoke('text').then(parseInt).should('gt', 2000);
    cy.get('@mark').invoke('text').then(parseInt).should('lt', 2500);

    cy.get('@state').should('text', 'finish');

    cy.get('@state').should('not.text', 'finish');
  });

  it('pending', () => {
    cy.get('[data-testid="Example-pending"]').as('example');
    cy.get('@example').find('button').as('button');
    cy.get('@example').find('[data-testid="Value-mark"] [data-testid="value"]').as('mark');
    cy.get('@example').find('[data-testid="Value-state"] [data-testid="value"]').as('state');

    cy.get('@button').click();

    cy.get('@state').should('text', 'processing');

    cy.get('@mark').should('not.text', '0');
    cy.get('@mark').invoke('text').then(parseInt).should('gt', 3000);
    cy.get('@mark').invoke('text').then(parseInt).should('lt', 3500);

    cy.get('@state').should('text', 'finish');

    cy.get('@button').click();

    cy.get('@state').should('not.text', 'finish');
  });

  it('failed', () => {
    cy.get('[data-testid="Example-failed"]').as('example');
    cy.get('@example').find('button').as('button');
    cy.get('@example').find('[data-testid="Value-error"] [data-testid="value"]').as('error');
    cy.get('@example').find('[data-testid="Value-state"] [data-testid="value"]').as('state');

    cy.get('@button').click();

    cy.get('@state').should('text', 'processing');

    cy.get('@error').should('text', 'FORBIDDEN');
    cy.get('@state').should('text', 'failed');

    cy.get('@button').click();

    cy.get('@state').should('not.text', 'failed');
  });
});
