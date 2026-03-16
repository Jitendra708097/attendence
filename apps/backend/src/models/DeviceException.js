/**
 * @module DeviceException
 * @description Device exception model for temporary device access without primary device registration
 */

module.exports = (sequelize, DataTypes) => {
  const DeviceException = sequelize.define(
    'DeviceException',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
      temporary_device_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      device_type: {
        type: DataTypes.ENUM('ios', 'android', 'web'),
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'used', 'expired', 'rejected'),
        defaultValue: 'pending',
      },
      request_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      approval_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      approver_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Employees', key: 'id' },
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'DeviceExceptions',
      timestamps: true,
      paranoid: true,
      underscored: true,
      scopes: {
        byOrg: (orgId) => ({ where: { org_id: orgId } }),
        pending: () => ({ where: { status: 'pending' } }),
      },
      indexes: [
        { fields: ['org_id', 'emp_id'] },
        { fields: ['temporary_device_id'] },
        { fields: ['status', 'expires_at'] },
      ],
    }
  );

  DeviceException.associate = (models) => {
    DeviceException.belongsTo(models.Organisation, { foreignKey: 'org_id', as: 'organisation' });
    DeviceException.belongsTo(models.Employee, { foreignKey: 'emp_id', as: 'employee' });
    DeviceException.belongsTo(models.Employee, { foreignKey: 'approver_id', as: 'approver' });
  };

  return DeviceException;
};
