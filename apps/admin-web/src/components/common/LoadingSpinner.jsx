/**
 * @module LoadingSpinner
 * @description Centered loading spinner component.
 */
import { Spin } from "antd";

export default function LoadingSpinner({ size = "large" }) {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <Spin size={size} />
    </div>
  );
}
