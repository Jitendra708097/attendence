/**
 * @module ImpersonationSession
 * @description Impersonation session model for superadmin troubleshooting and support
 */

module.exports = (sequelize, DataTypes) => {
  const ImpersonationSession = sequelize.define(
    'ImpersonationSession',
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
      super_admin_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Employees', key: 'id' },
      },
      target_emp_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Employees', key: 'id' },
      },
      session_token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      started_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      ended_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actions_logged: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
    },
    {
      tableName: 'ImpersonationSessions',
      timestamps: true,
      paranoid: true,
      underscored: true,
      scopes: {
        byOrg: (orgId) => ({ where: { org_id: orgId } }),
        active: () => ({ where: { ended_at: null } }),
      },
      indexes: [
        { fields: ['org_id', 'super_admin_id'] },
        { fields: ['target_emp_id', 'ended_at'] },
      ],
    }
  );

  ImpersonationSession.associate = (models) => {
    ImpersonationSession.belongsTo(models.Organisation, { foreignKey: 'org_id', as: 'organisation' });
    ImpersonationSession.belongsTo(models.Employee, { foreignKey: 'super_admin_id', as: 'superAdmin' });
    ImpersonationSession.belongsTo(models.Employee, { foreignKey: 'target_emp_id', as: 'targetEmployee' });
  };

  return ImpersonationSession;
};
