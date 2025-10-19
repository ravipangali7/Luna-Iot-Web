import React from 'react';

interface RadarAnimationProps {
  center: { lat: number; lng: number };
  radius?: number;
  color?: string;
  pulseCount?: number;
  duration?: number;
}

const RadarAnimation: React.FC<RadarAnimationProps> = ({
  duration = 6000 // 6 seconds per rotation
}) => {
  const styles = `
    .radar-animation-container {
      position: relative;
      pointer-events: none;
      z-index: 10;
    }
    
    .panel {
      margin: auto;
      box-shadow: inset 0 0 0 96px rgba(255, 255, 255, 0.3),
                  inset 0 0 0 100px rgba(46, 125, 50, 0.3),
                  inset 0 0 0 199px rgba(255, 255, 255, 0.5),
                  inset 0 0 0 200px rgba(46, 125, 50, 0.5),
                  inset 0 0 0 299px rgba(255, 255, 255, 0.5),
                  inset 0 0 0 300px rgba(0, 255, 0, 0.2);
      border-radius: 50%;
      transform: rotate(0deg);
      overflow: hidden;
      width: 500px;
      height: 500px;
      border: 3px solid #53ab56;
      opacity: 0.8;
      position: relative;
    }
    
    .panel::before {
      content: "";
      position: absolute;
      top: 0;
      left: 50%;
      width: 2px;
      height: 100%;
      background: rgba(83, 171, 86, 0.6);
      transform: translateX(-50%);
    }
    
    .panel::after {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 2px;
      background: rgba(83, 171, 86, 0.6);
      transform: translateY(-50%);
    }
    
    .panel .center-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      border: 2px solid rgba(83, 171, 86, 0.6);
      z-index: 2;
    }
    
    .panel .scanner {
      animation: scanning ${duration}ms infinite linear;
      background: linear-gradient(to top right, #76FF03 0%, rgba(0, 0, 0, 0) 60%);
      transform-origin: top left;
      position: absolute;
      top: 50%;
      left: 50%;
      width: 800px;
      height: 800px;
      border-left: 3px solid rgba(46, 125, 50, 0.5);
    }
    
    .panel .something {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .panel .something li {
      animation: target ${duration}ms infinite linear;
      border-radius: 50%;
      box-shadow: 0 0 10px #1B5E20;
      opacity: 0;
      display: block;
      position: absolute;
      width: 10px;
      height: 10px;
      background: #1B5E20;
    }
    
    .panel .something li:nth-child(1) {
      animation-delay: ${duration * 0.375}ms;
      top: 30%;
      left: 30%;
    }
    
    .panel .something li:nth-child(2) {
      animation-delay: ${duration * 0.125}ms;
      top: 60%;
      left: 40%;
    }
    
    .panel .something li:nth-child(3) {
      animation-delay: ${duration * 0.625}ms;
      top: 45%;
      left: 65%;
    }
    
    .panel .something li:nth-child(4) {
      animation-delay: ${duration * 0.875}ms;
      top: 70%;
      left: 55%;
    }
    
    .panel .something li:nth-child(5) {
      animation-delay: ${duration * 0.25}ms;
      top: 25%;
      left: 70%;
    }
    
    @keyframes scanning {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    @keyframes target {
      0% {
        opacity: 0;
      }
      5% {
        opacity: 1;
      }
      95% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="radar-animation-container">
        <div className="panel">
          <div className="center-circle"></div>
          <div className="scanner"></div>
          <ul className="something">
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default RadarAnimation;
