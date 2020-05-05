import get from 'lodash/get';

Cypress.Commands.add('findReact', { prevSubject: 'optional' }, (subject, selector) => {
  const results = [];
  const find = (dom) => {
    Cypress.$(dom).children().each((idx, $el) => {
      const getInternalInstance = $el[Object.keys($el).find((k) => k.startsWith('__reactInternalInstance'))];
      if (getInternalInstance === undefined) return;
      const name = get(getInternalInstance, ['return', 'elementType', 'name']);
      if (name === selector) results.push($el.parentElement);
    });
    Cypress.$(dom).children().each((idx, $el) => find($el));
  };

  find(Cypress.$(subject || 'body'));

  return results.length > 1 ? results : results[0];
});
