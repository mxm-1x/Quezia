import { useState, useEffect } from 'react';

export const useScrollAnimation = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate transform and opacity based on scroll
  const translateY = -scrollY * 0.3; // Move up slowly (negative for upward movement)
  const opacity = Math.max(0, 1 - scrollY / 600); // Fade out over 600px scroll

  return { translateY, opacity };
};