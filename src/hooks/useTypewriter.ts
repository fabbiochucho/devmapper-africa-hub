
import { useState, useEffect } from 'react';

export const useTypewriter = (text: string, speed = 50, key: any = null) => {
  const [displayText, setDisplayText] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!text) return;
    setDisplayText('');
    setIsFinished(false);
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsFinished(true);
      }
    }, speed);

    return () => {
      clearInterval(typingInterval);
    };
  }, [text, speed, key]);

  return { displayText, isFinished };
};

