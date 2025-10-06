import { CountdownCircleTimer } from 'react-countdown-circle-timer'

//https://www.npmjs.com/package/react-countdown-circle-timer
//https://codesandbox.io/p/sandbox/musing-davinci-mqssz

interface CountdownTimerProps {
    seconds: number
    size: number
}


const CountdownTimer: React.FC<CountdownTimerProps> = ({ seconds, size }) => {
  return(
  <CountdownCircleTimer
    isPlaying
    duration={seconds}
    colors={['#004777', '#F7B801', '#A30000', '#A30000']}
    colorsTime={[7, 5, 2, 0]}
    size={size}
    strokeWidth={9}
    
  >
    {({ remainingTime }) => remainingTime}
  </CountdownCircleTimer>
  )
  
}


export default CountdownTimer
