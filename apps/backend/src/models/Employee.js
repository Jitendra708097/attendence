/**
 * @module Employee
 * @description Sequelize model for employees.
 */
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    'Employee',
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
      branch_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      shift_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: DataTypes.STRING,
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: DataTypes.STRING,
      password_hash: DataTypes.STRING,
      role: {
        type: DataTypes.ENUM('employee', 'admin'),
        defaultValue: 'employee',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
      },
      face_embedding_local: {
        type: DataTypes.JSONB,
        defaultValue: null,
      },
      face_embedding_id: DataTypes.STRING,
      registered_device_id: DataTypes.STRING,
      leave_balance: {
        type: DataTypes.JSONB,
        defaultValue: {
          casual: 10,
          sick: 8,
          earned: 5,
          last_updated: new Date().toISOString(),
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login_at: DataTypes.DATE,
    },
    {
      tableName: 'employees',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Employee.associate = (models) => {
    Employee.belongsTo(models.Organisation, {
      foreignKey: 'org_id',
      as: 'organisation',
    });
    Employee.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      as: 'branch',
    });
    Employee.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department',
    });
    Employee.belongsTo(models.Shift, {
      foreignKey: 'shift_id',
      as: 'shift',
    });
    Employee.hasMany(models.Attendance, {
      foreignKey: 'emp_id',
      as: 'attendances',
    });
  };

  return Employee;
};
