
import { useState, useEffect, useCallback, useRef } from 'react';

export const useTypewriter = (text: string, speed = 50, repeatDelay: number | null = null) => {
  const [displayText, setDisplayText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const repeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTyping = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    setDisplayText('');
    setIsFinished(false);
    let i = 0;

    typingIntervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.substring(0, i + 1));
        i++;
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
        setIsFinished(true);

        if (repeatDelay !== null) {
          repeatTimeoutRef.current = setTimeout(startTyping, repeatDelay);
        }
      }
    }, speed);
  }, [text, speed, repeatDelay]);

  useEffect(() => {
    if (!text) return;

    startTyping();

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      if (repeatTimeoutRef.current) {
        clearTimeout(repeatTimeoutRef.current);
      }
    };
  }, [text, startTyping]);

  return { displayText, isFinished };
};
