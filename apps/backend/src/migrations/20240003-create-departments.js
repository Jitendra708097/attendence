/**
 * @module 20240003-create-departments
 * @description Create departments table. Tenant-scoped with optional hierarchy.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('departments', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      parent_id: {
        type: Sequelize.UUID,
        references: { model: 'departments', key: 'id' },
      },
      description: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('departments', ['org_id']);
    await queryInterface.addIndex('departments', ['parent_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('departments');
  },
};
