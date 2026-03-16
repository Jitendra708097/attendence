/**
 * @module SearchInput
 * @description Debounced search input component.
 */
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useState } from "react";

export default function SearchInput({ onSearch, placeholder }) {
  const [value, setValue] = useState("");

  const handleChange = (e) => {
    setValue(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <Input
      placeholder={placeholder || "Search..."}
      prefix={<SearchOutlined />}
      value={value}
      onChange={handleChange}
      className="rounded"
    />
  );
}
