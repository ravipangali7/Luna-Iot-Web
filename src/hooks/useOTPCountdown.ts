import { useState, useEffect, useCallback } from 'react';

export const useOTPCountdown = (initialCountdown: number = 60) => {
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const startCountdown = useCallback(() => {
    setCountdown(initialCountdown);
    setCanResend(false);
  }, [initialCountdown]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  return { countdown, canResend, startCountdown };
};

