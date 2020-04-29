module.exports = ({ app }) => {
  app.all('/status/:status(\\d+)/:delay(\\d+)', (req, res) => {
    const { status, delay } = req.params;
    setTimeout(() => res.sendStatus(status), delay * 1000);
  });
  app.all('/status/:status(\\d+)', (req, res) => {
    const { status } = req.params;
    res.sendStatus(status);
  });
};
