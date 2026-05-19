import React, { useEffect, useState, useRef } from 'react';

const Timer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startTime) return;

    const tick = () => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(Math.max(0, seconds));
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => clearInterval(intervalRef.current);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const pad = (n) => String(n).padStart(2, '0');

  return `${hours > 0 ? pad(hours) + ':' : ''}${pad(minutes)}:${pad(seconds)}`;
};

export default Timer;
