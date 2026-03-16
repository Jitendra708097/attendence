/**
 * @module Regularisation
 * @description Regularisation request model for late check-ins, early check-outs, and missing attendance
 */

module.exports = (sequelize, DataTypes) => {
  const Regularisation = sequelize.define(
    'Regularisation',
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
      attendance_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Attendances', key: 'id' },
      },
      issue_type: {
        type: DataTypes.ENUM('late_checkin', 'early_checkout', 'missing_attendance', 'incomplete_session'),
        allowNull: false,
      },
      evidence_type: {
        type: DataTypes.ENUM('email_reply', 'message', 'document', 'verbal', 'other'),
        allowNull: false,
      },
      evidence_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending_manager', 'pending_admin', 'approved', 'rejected'),
        defaultValue: 'pending_manager',
      },
      manager_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Employees', key: 'id' },
      },
      manager_approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      manager_rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      admin_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Employees', key: 'id' },
      },
      admin_approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      admin_rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'Regularisations',
      timestamps: true,
      paranoid: true,
      underscored: true,
      scopes: {
        byOrg: (orgId) => ({ where: { org_id: orgId } }),
      },
    }
  );

  Regularisation.associate = (models) => {
    Regularisation.belongsTo(models.Organisation, { foreignKey: 'org_id', as: 'organisation' });
    Regularisation.belongsTo(models.Employee, { foreignKey: 'emp_id', as: 'employee' });
    Regularisation.belongsTo(models.Attendance, { foreignKey: 'attendance_id', as: 'attendance' });
    Regularisation.belongsTo(models.Employee, { foreignKey: 'manager_id', as: 'manager' });
    Regularisation.belongsTo(models.Employee, { foreignKey: 'admin_id', as: 'approver' });
  };

  return Regularisation;
};
