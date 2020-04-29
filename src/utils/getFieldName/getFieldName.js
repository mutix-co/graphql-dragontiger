module.exports = function getFieldName(query) {
  return query.definitions[0].selectionSet.selections[0].name.value;
};
