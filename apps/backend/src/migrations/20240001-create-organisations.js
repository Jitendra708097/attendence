/**
 * @module 20240001-create-organisations
 * @description Create organisations (root tenant) table. Root table - no org_id FK.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('organisations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
      },
      phone: {
        type: Sequelize.STRING,
      },
      plan: {
        type: Sequelize.ENUM('trial', 'starter', 'growth', 'enterprise'),
        defaultValue: 'trial',
      },
      trial_ends_at: {
        type: Sequelize.DATE,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      timezone: {
        type: Sequelize.STRING,
        defaultValue: 'Asia/Kolkata',
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
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

    // Indexes
    await queryInterface.addIndex('organisations', ['slug']);
    await queryInterface.addIndex('organisations', ['is_active']);
    await queryInterface.addIndex('organisations', ['created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('organisations');
  },
};
