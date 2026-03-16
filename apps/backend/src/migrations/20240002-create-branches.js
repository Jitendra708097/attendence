/**
 * @module 20240002-create-branches
 * @description Create branches (office locations) table. Tenant-scoped.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('branches', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organisations',
          key: 'id',
        },
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
      },
      city: {
        type: Sequelize.STRING,
      },
      is_remote: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      geo_fence_polygons: {
        type: Sequelize.JSONB,
        defaultValue: null,
      },
      fallback_radius_meters: {
        type: Sequelize.INTEGER,
        defaultValue: 200,
      },
      wifi_verification_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      allowed_bssids: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      timezone: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex('branches', ['org_id']);
    await queryInterface.addIndex('branches', ['org_id', 'is_remote']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('branches');
  },
};
