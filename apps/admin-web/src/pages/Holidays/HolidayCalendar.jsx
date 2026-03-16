/**
 * @module HolidayCalendar
 * @description Holiday calendar display component.
 */
import { Calendar, Tag } from 'antd';

export default function HolidayCalendar({ holidays = [] }) {
  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    return holidays.filter(h => h.date === dateStr);
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={item.id} className="text-xs">
            <Tag>{item.name}</Tag>
          </li>
        ))}
      </ul>
    );
  };

  return <Calendar cellRender={dateCellRender} />;
}