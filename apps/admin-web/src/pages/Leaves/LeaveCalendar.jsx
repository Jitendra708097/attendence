/**
 * @module LeaveCalendar
 * @description Team leave calendar view.
 */
import { Calendar, Tag, Empty, Card, Select } from 'antd';
import dayjs from 'dayjs';

const LEAVE_TYPE_COLORS = {
  casual: '#2f54eb',
  sick: '#eb2f96',
  earned: '#faad14',
  optional: '#52c41a',
};

export default function LeaveCalendar({ leaves, onDateSelect }) {
  const getListData = (value) => {
    return leaves?.filter((leave) => {
      const fromDate = dayjs(leave.fromDate);
      const toDate = dayjs(leave.toDate);
      return value.isBetween(fromDate, toDate, null, '[]');
    }) || [];
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map((item) => (
          <li key={item.id}>
            <Tag color={LEAVE_TYPE_COLORS[item.leaveType] || '#2f54eb'} style={{ fontSize: 10 }}>
              {item.employeeName}
            </Tag>
          </li>
        ))}
      </ul>
    );
  };

  return <Calendar fullscreen dateCellRender={dateCellRender} />;
}