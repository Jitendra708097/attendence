/**
 * @module AttendanceLineChart
 * @description Recharts line chart for attendance trends.
 */
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AttendanceLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="present" stroke="#52c41a" name="Present" />
        <Line type="monotone" dataKey="absent" stroke="#ff4d4f" name="Absent" />
        <Line type="monotone" dataKey="leave" stroke="#1890ff" name="On Leave" />
      </LineChart>
    </ResponsiveContainer>
  );
}
