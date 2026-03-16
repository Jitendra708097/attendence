/**
 * @module 20240004-create-shifts
 * @description Create shifts (working hours templates) table. Tenant-scoped.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('shifts', {
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
      branch_id: {
        type: Sequelize.UUID,
        references: { model: 'branches', key: 'id' },
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      crosses_midnight: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      work_days: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: [1, 2, 3, 4, 5],
      },
      grace_minutes_checkin: {
        type: Sequelize.INTEGER,
        defaultValue: 15,
      },
      grace_minutes_checkout: {
        type: Sequelize.INTEGER,
        defaultValue: 60,
      },
      half_day_after_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 240,
      },
      absent_after_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 120,
      },
      overtime_after_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 480,
      },
      min_overtime_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
      },
      break_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 60,
      },
      min_session_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
      },
      session_cooldown_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 15,
      },
      max_sessions_per_day: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('shifts', ['org_id']);
    await queryInterface.addIndex('shifts', ['branch_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('shifts');
  },
};
