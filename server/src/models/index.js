/**
 * Models Index
 * Export all Mongoose models from a single point
 */
const User = require('./User');
const Patient = require('./Patient');

module.exports = {
  User,
  Patient
};
