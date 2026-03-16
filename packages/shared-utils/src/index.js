/**
 * @module index
 * @description Main entry point for shared utilities.
 */

// Math utilities
const cosineSimilarity = require('./cosineSimilarity.js');
const haversine = require('./haversine.js');
const rayCasting = require('./rayCasting.js');

// Model utilities
const scopedModel = require('./scopedModel.js');

module.exports = {
  cosineSimilarity,
  haversine,
  rayCasting,
  scopedModel,
};
