/**
 * @module Organisation
 * @description Sequelize model for organisations (root tenant).
 */
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Organisation = sequelize.define(
    'Organisation',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      plan: {
        type: DataTypes.ENUM('trial', 'starter', 'pro', 'enterprise'),
        defaultValue: 'trial',
      },
      timezone: {
        type: DataTypes.STRING,
        defaultValue: 'Asia/Kolkata',
      },
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {
          max_employees: 200,
          max_branches: 5,
          api_quota: 10000,
          billing_email: null,
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'organisations',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Organisation.associate = (models) => {
    Organisation.hasMany(models.Branch, {
      foreignKey: 'org_id',
      as: 'branches',
    });
    Organisation.hasMany(models.Employee, {
      foreignKey: 'org_id',
      as: 'employees',
    });
  };

  return Organisation;
};
