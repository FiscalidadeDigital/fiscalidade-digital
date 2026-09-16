'use client';

import { useEffect, useState } from 'react';

interface Props {
  end: number;
  suffix?: string;
  duration?: number;
}

export default function Counter({
  end,
  suffix = '',
  duration = 2000,
}: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(
        elapsed / duration,
        1,
      );

      const current = Math.floor(
        progress * end,
      );

      setCount(current);

      if (progress >= 1) {
        clearInterval(timer);
        setCount(end);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <>
      {count.toLocaleString('pt-AO')}
      {suffix}
    </>
  );
}