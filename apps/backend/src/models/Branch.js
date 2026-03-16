/**
 * @module Branch
 * @description Sequelize model for branches.
 */
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    const Branch = sequelize.define(
      'Branch',
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: () => uuidv4(),
        },
        org_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        address: DataTypes.STRING,
        city: DataTypes.STRING,
        is_remote: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        geo_fence_polygons: {
          type: DataTypes.JSONB,
          defaultValue: [],
        },
        wifi_verification_enabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        allowed_bssids: {
          type: DataTypes.JSONB,
          defaultValue: [],
        },
      },
      {
        tableName: 'branches',
        timestamps: true,
        paranoid: true,
        underscored: true,
        scopes: {
          byOrg: (orgId) => ({
            where: { org_id: orgId },
          }),
        },
      }
    );

    Branch.associate = (models) => {
      Branch.belongsTo(models.Organisation, {
        foreignKey: 'org_id',
        as: 'organisation',
      });
      Branch.hasMany(models.Employee, {
        foreignKey: 'branch_id',
        as: 'employees',
      });
    };

    return Branch;
};
