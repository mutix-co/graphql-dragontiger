context('useMutation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6060/#/hooks/useMutation');
  });

  it('finish', () => {
    cy.get('[data-testid="useMutation-example-0"] [data-testid="component"]:eq(0)').as('component');
    cy.get('@component').find('[data-testid="button"]').as('button');
    cy.get('@component').find('[data-testid="mark"]').as('mark');
    cy.get('@component').find('[data-testid="state"]').as('state');

    cy.get('@button').click();

    cy.get('@state').should('text', 'processing');

    cy.get('@mark').should('not.text', '0');
    cy.get('@mark').invoke('text').then(parseInt).should('gt', 2000);
    cy.get('@mark').invoke('text').then(parseInt).should('lt', 2100);

    cy.get('@state').should('text', 'finish');

    cy.get('@state').should('not.text', 'finish');
  });

  it('pending', () => {
    cy.get('[data-testid="useMutation-example-0"] [data-testid="component"]:eq(1)').as('component');
    cy.get('@component').find('[data-testid="button"]').as('button');
    cy.get('@component').find('[data-testid="mark"]').as('mark');
    cy.get('@component').find('[data-testid="state"]').as('state');

    cy.get('@button').click();

    cy.get('@state').should('text', 'processing');

    cy.get('@mark').should('not.text', '0');
    cy.get('@mark').invoke('text').then(parseInt).should('gt', 4000);
    cy.get('@mark').invoke('text').then(parseInt).should('lt', 4100);

    cy.get('@state').should('text', 'finish');

    cy.get('@button').click();

    cy.get('@state').should('not.text', 'finish');
  });

  it('failed', () => {
    cy.get('[data-testid="useMutation-example-0"] [data-testid="component"]:eq(2)').as('component');
    cy.get('@component').find('[data-testid="button"]').as('button');
    cy.get('@component').find('[data-testid="error"]').as('error');
    cy.get('@component').find('[data-testid="state"]').as('state');

    cy.get('@button').click();

    cy.get('@state').should('text', 'processing');

    cy.get('@error').should('text', 'FORBIDDEN');
    cy.get('@state').should('text', 'failed');

    cy.get('@button').click();

    cy.get('@state').should('not.text', 'failed');
  });
});
