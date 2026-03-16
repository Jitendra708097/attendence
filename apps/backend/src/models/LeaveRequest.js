/**
 * @module LeaveRequest
 * @description Leave request model for employee leave management with multi-level approval flow
 */

module.exports = (sequelize, DataTypes) => {
  const LeaveRequest = sequelize.define(
    'LeaveRequest',
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
      leave_type: {
        type: DataTypes.ENUM('casual', 'sick', 'earned', 'unpaid', 'maternity', 'bereavement'),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      days_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      half_day: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      half_day_period: {
        type: DataTypes.ENUM('first_half', 'second_half'),
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending_manager', 'pending_admin', 'approved', 'rejected', 'cancelled'),
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
      is_counted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'LeaveRequests',
      timestamps: true,
      paranoid: true,
      underscored: true,
      scopes: {
        byOrg: (orgId) => ({ where: { org_id: orgId } }),
      },
    }
  );

  LeaveRequest.associate = (models) => {
    LeaveRequest.belongsTo(models.Organisation, { foreignKey: 'org_id', as: 'organisation' });
    LeaveRequest.belongsTo(models.Employee, { foreignKey: 'emp_id', as: 'employee' });
    LeaveRequest.belongsTo(models.Employee, { foreignKey: 'manager_id', as: 'manager' });
    LeaveRequest.belongsTo(models.Employee, { foreignKey: 'admin_id', as: 'approver' });
  };

  return LeaveRequest;
};
