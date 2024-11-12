import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  formatOptions?: Intl.NumberFormatOptions;
}

export function AnimatedNumber({ value, formatOptions }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const steps = 12; // Number of steps in the animation
      const stepDuration = 50; // Duration of each step in ms
      const increment = (value - displayValue) / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep === steps) {
          setDisplayValue(value);
          setIsAnimating(false);
          clearInterval(interval);
        } else {
          setDisplayValue(prev => prev + increment);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [value]);

  const formattedValue = new Intl.NumberFormat('en-US', formatOptions).format(displayValue);
  return (
    <motion.span
      key={isAnimating ? 'animating' : 'static'}
      initial={{ opacity: isAnimating ? 0.8 : 1 }}
      animate={{ opacity: 1 }}
      className="tabular-nums"
    >
      {formattedValue}
    </motion.span>
  );
} 