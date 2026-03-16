/**
 * @module 20240013-create-refresh-tokens
 * @description Create refresh_tokens table. Stores bcrypt hash of refresh token.
 * Tokens can be: 'active' (current), 'used' (rotated out), 'revoked' (logout/password change).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('refresh_tokens', {
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
      token_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'used', 'revoked'),
        defaultValue: 'active',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
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

    await queryInterface.addIndex('refresh_tokens', ['org_id']);
    await queryInterface.addIndex('refresh_tokens', ['emp_id', 'status']);
    await queryInterface.addIndex('refresh_tokens', ['expires_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('refresh_tokens');
  },
};
