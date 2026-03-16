/**
 * @module 20240005-create-employees
 * @description Create employees table. Tenant-scoped with face/device registration.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employees', {
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
      department_id: {
        type: Sequelize.UUID,
        references: { model: 'departments', key: 'id' },
      },
      shift_id: {
        type: Sequelize.UUID,
        references: { model: 'shifts', key: 'id' },
      },
      name: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
      },
      employee_code: {
        type: Sequelize.STRING,
      },
      password_hash: {
        type: Sequelize.STRING,
      },
      temp_password: {
        type: Sequelize.STRING,
      },
      role: {
        type: Sequelize.ENUM('admin', 'manager', 'employee'),
        defaultValue: 'employee',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      face_embedding_local: {
        type: Sequelize.JSONB,
        defaultValue: null,
      },
      face_embedding_id: {
        type: Sequelize.STRING,
      },
      face_trust_score: {
        type: Sequelize.ENUM('probationary', 'default', 'trusted', 'flagged'),
        defaultValue: 'probationary',
      },
      face_checkin_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      registered_device_id: {
        type: Sequelize.STRING,
      },
      leave_balance: {
        type: Sequelize.JSONB,
        defaultValue: { annual: 12, sick: 6, casual: 6 },
      },
      last_login_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('employees', ['org_id']);
    await queryInterface.addIndex('employees', ['org_id', 'email'], { unique: true });
    await queryInterface.addIndex('employees', ['branch_id']);
    await queryInterface.addIndex('employees', ['department_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('employees');
  },
};
