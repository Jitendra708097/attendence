/**
 * @module DateRangePicker
 * @description Date range picker wrapper component.
 */
import { DatePicker, Space } from "antd";

export default function DateRangePickerComponent({ onDateChange }) {
  return (
    <Space direction="vertical" className="w-full">
      <DatePicker.RangePicker
        className="w-full"
        onChange={(dates) => onDateChange?.(dates)}
        placeholder={["Start Date", "End Date"]}
      />
    </Space>
  );
}
