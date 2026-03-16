/**
 * @module DeviceToken
 * @description Device token model for Firebase Cloud Messaging (FCM) push notifications
 */

module.exports = (sequelize, DataTypes) => {
  const DeviceToken = sequelize.define(
    'DeviceToken',
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
      fcm_token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      device_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      device_type: {
        type: DataTypes.ENUM('ios', 'android', 'web'),
        allowNull: false,
      },
      device_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'DeviceTokens',
      timestamps: true,
      paranoid: true,
      underscored: true,
      scopes: {
        byOrg: (orgId) => ({ where: { org_id: orgId } }),
      },
      indexes: [
        { fields: ['org_id', 'emp_id'] },
        { unique: true, fields: ['emp_id', 'device_id'] },
      ],
    }
  );

  DeviceToken.associate = (models) => {
    DeviceToken.belongsTo(models.Organisation, { foreignKey: 'org_id', as: 'organisation' });
    DeviceToken.belongsTo(models.Employee, { foreignKey: 'emp_id', as: 'employee' });
  };

  return DeviceToken;
};
