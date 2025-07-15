import React from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@react-hook/window-size';

const ConfettiWrapper: React.FC = () => {
  const [width, height] = useWindowSize();
  return <Confetti width={width} height={height} />;
};

export default ConfettiWrapper;
