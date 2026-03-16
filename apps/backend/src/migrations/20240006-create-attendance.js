/**
 * @module 20240006-create-attendance
 * @description Create attendance records table. One per employee per day. UNIQUE(org_id, emp_id, date).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('attendance', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organisations', key: 'id' },
      },
      emp_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'employees', key: 'id' },
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'branches', key: 'id' },
      },
      shift_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'shifts', key: 'id' },
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      first_check_in: Sequelize.DATE,
      last_check_out: Sequelize.DATE,
      total_worked_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      session_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('present', 'absent', 'half_day', 'half_day_early', 'on_leave', 'holiday', 'weekend'),
      },
      is_late: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      has_overtime: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      overtime_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_finalised: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_anomaly: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      anomaly_reason: Sequelize.STRING,
      is_manual: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      marked_by: Sequelize.UUID,
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: Sequelize.DATE,
    });

    // UNIQUE constraint per org per employee per date
    await queryInterface.addConstraint('attendance', {
      fields: ['org_id', 'emp_id', 'date'],
      type: 'unique',
      name: 'attendance_uk_org_emp_date',
    });

    // Indexes
    await queryInterface.addIndex('attendance', ['org_id']);
    await queryInterface.addIndex('attendance', ['org_id', 'date']);
    await queryInterface.addIndex('attendance', ['org_id', 'emp_id']);
    await queryInterface.addIndex('attendance', ['emp_id', 'date']);
    await queryInterface.addIndex('attendance', ['deleted_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('attendance');
  },
};
