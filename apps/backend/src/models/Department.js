/**
 * @module Department
 * @description Sequelize model for departments.
 */
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    const Department = sequelize.define(
      'Department',
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
        parent_id: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        head_emp_id: {
          type: DataTypes.UUID,
          allowNull: true,
        },
      },
      {
        tableName: 'departments',
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

    Department.associate = (models) => {
      Department.belongsTo(models.Organisation, {
        foreignKey: 'org_id',
        as: 'organisation',
      });
      Department.belongsTo(Department, {
        foreignKey: 'parent_id',
        as: 'parentDepartment',
      });
      Department.hasMany(Department, {
        foreignKey: 'parent_id',
        as: 'subDepartments',
      });
    };

    return Department;
};
