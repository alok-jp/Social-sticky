let ioInstance = null;

module.exports = {
  init: (io) => { ioInstance = io; },
  get: () => ioInstance,
};
