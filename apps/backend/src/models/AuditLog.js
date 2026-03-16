/**
 * @module AuditLog
 * @description Audit log model for immutable action trail of sensitive operations
 */

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      org_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Organisations', key: 'id' },
      },
      emp_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Employees', key: 'id' },
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      resource_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      resource_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      changes: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      success: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      impersonated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Employees', key: 'id' },
      },
    },
    {
      tableName: 'AuditLogs',
      timestamps: true,
      underscored: true,
      scopes: {
        byOrg: (orgId) => ({ where: { org_id: orgId } }),
      },
      indexes: [
        { fields: ['org_id', 'created_at'] },
        { fields: ['org_id', 'emp_id'] },
        { fields: ['resource_type', 'resource_id'] },
        { fields: ['action'] },
      ],
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.Organisation, { foreignKey: 'org_id', as: 'organisation' });
    AuditLog.belongsTo(models.Employee, { foreignKey: 'emp_id', as: 'employee' });
    AuditLog.belongsTo(models.Employee, { foreignKey: 'impersonated_by', as: 'impersonator' });
  };

  return AuditLog;
};
