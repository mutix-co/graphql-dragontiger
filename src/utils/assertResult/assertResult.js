module.exports = function assertResult(value, error) {
  if (value === undefined || value === null) throw error;
  return value;
};
