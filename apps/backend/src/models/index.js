/**
 * @module models/index
 * @description Sequelize models initialization and associations.
 * Exports all models and sequelize instance.
 */
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const config = require('./../config/database.js');

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {};

// Load all models
fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'index.js' && file !== 'models-init.js')
  .forEach(file => {
    const modelFactory = require(path.join(__dirname, file));
    const model = modelFactory(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
