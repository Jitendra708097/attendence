/**
 * @module AttendanceSession
 * @description Sequelize model for individual check-in/check-out sessions.
 */
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    const AttendanceSession = sequelize.define(
      'AttendanceSession',
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: () => uuidv4(),
        },
        attendance_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        org_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        session_number: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        check_in_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        check_out_time: DataTypes.DATE,
        worked_minutes: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        status: {
          type: DataTypes.ENUM('open', 'completed', 'auto_closed'),
          defaultValue: 'open',
        },
      },
      {
        tableName: 'attendance_sessions',
        timestamps: true,
        paranoid: true,
        underscored: true,
        scopes: {
          byOrg: (orgId) => ({
            where: { org_id: orgId },
          }),
        },
      }
    );

    AttendanceSession.associate = (models) => {
      AttendanceSession.belongsTo(models.Attendance, {
        foreignKey: 'attendance_id',
        as: 'attendance',
      });
    };

    return AttendanceSession;
};
