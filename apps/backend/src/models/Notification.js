/**
 * @module Notification
 * @description Notification model for real-time in-app and push notifications
 */

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
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
      notification_type: {
        type: DataTypes.ENUM(
          'leave_approved',
          'leave_rejected',
          'leave_requested',
          'check_in_reminder',
          'check_out_reminder',
          'geofence_alert',
          'attendance_marked',
          'regularisation_approved',
          'regularisation_rejected',
          'leave_balance_low',
          'system_alert'
        ),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      action_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      action_type: {
        type: DataTypes.ENUM('view_leave', 'view_attendance', 'view_regularisation', 'navigate', 'app_action'),
        allowNull: true,
      },
      action_data: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sent_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      fcm_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'Notifications',
      timestamps: true,
      paranoid: true,
      underscored: true,
      scopes: {
        byOrg: (orgId) => ({ where: { org_id: orgId } }),
        unread: () => ({ where: { is_read: false } }),
      },
      indexes: [
        { fields: ['org_id', 'emp_id'] },
        { fields: ['emp_id', 'is_read'] },
        { fields: ['org_id', 'created_at'] },
      ],
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.Organisation, { foreignKey: 'org_id', as: 'organisation' });
    Notification.belongsTo(models.Employee, { foreignKey: 'emp_id', as: 'employee' });
  };

  return Notification;
};
