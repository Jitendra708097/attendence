/**
 * @module useCountUp
 * @description Animates a number from 0 to target value using
 *              ease-out cubic easing. Used in StatCard for all metrics.
 */

import { useState, useEffect } from 'react';

export const useCountUp = (target, duration = 1000) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target == null || isNaN(target)) return;
    const numTarget = Number(target);
    const start = Date.now();

    const tick = () => {
      const elapsed  = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(numTarget * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
};
