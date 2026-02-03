/**
 * Utilities Index
 * Export all utilities from a single point
 */
const mlService = require('./mlService');
const socketUtils = require('./socket');

module.exports = {
  ...mlService,
  ...socketUtils
};
