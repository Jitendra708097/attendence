/**
 * @module Holiday
 * @description Holiday calendar model for managing public holidays and company-wide off days
 */

module.exports = (sequelize, DataTypes) => {
  const Holiday = sequelize.define(
    'Holiday',
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
      branch_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Branches', key: 'id' },
      },
      holiday_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_optional: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      recurring_pattern: {
        type: DataTypes.ENUM('yearly', 'monthly'),
        allowNull: true,
      },
      impact_on_leave: {
        type: DataTypes.ENUM('full_day', 'half_day', 'no_deduction'),
        defaultValue: 'full_day',
      },
    },
    {
      tableName: 'Holidays',
      timestamps: true,
      paranoid: true,
      underscored: true,
      scopes: {
        byOrg: (orgId) => ({ where: { org_id: orgId } }),
      },
    }
  );

  Holiday.associate = (models) => {
    Holiday.belongsTo(models.Organisation, { foreignKey: 'org_id', as: 'organisation' });
    Holiday.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  };

  return Holiday;
};
