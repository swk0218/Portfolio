import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import * as THREE from 'three';

const mount = document.getElementById('heroShaderGradient');
const MAX_CLOCK_DELTA = 1 / 30;

function clampThreeClockDelta() {
  const clockPrototype = THREE.Clock && THREE.Clock.prototype;

  if (!clockPrototype || clockPrototype.__heroDeltaClampApplied) {
    return;
  }

  Object.defineProperty(clockPrototype, '__heroDeltaClampApplied', {
    value: true
  });

  clockPrototype.getDelta = function getClampedDelta() {
    let delta = 0;

    if (this.autoStart && !this.running) {
      this.start();
      return delta;
    }

    if (!this.running) {
      return delta;
    }

    const newTime = performance.now();

    delta = (newTime - this.oldTime) / 1000;
    this.oldTime = newTime;

    if (!Number.isFinite(delta) || delta <= 0) {
      return 0;
    }

    delta = Math.min(delta, MAX_CLOCK_DELTA);
    this.elapsedTime += delta;

    return delta;
  };
}

if (mount) {
  clampThreeClockDelta();

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shaderSpeed = 0.1;

  const shaderProps = {
    axesHelper: 'off',
    bgColor1: '#111111',
    bgColor2: '#111111',
    brightness: 0.95,
    cAzimuthAngle: 290,
    cDistance: 0.5,
    cPolarAngle: 180,
    cameraZoom: 21.13,
    color1: '#111111',
    color2: '#1017B8',
    color3: '#111111',
    destination: 'onCanvas',
    embedMode: 'off',
    enableTransition: false,
    envPreset: 'city',
    format: 'gif',
    frameRate: 10,
    gizmoHelper: 'hide',
    grain: 'off',
    lightType: '3d',
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    range: 'disabled',
    rangeEnd: 40,
    rangeStart: 0,
    reflection: 0.22,
    rotationX: 0,
    rotationY: 190,
    rotationZ: 90,
    shader: 'defaults',
    type: 'sphere',
    uAmplitude: 2.75,
    uDensity: 1.75,
    uFrequency: 5.5,
    uSpeed: shaderSpeed,
    uStrength: 1,
    uTime: 0,
    wireframe: false,
    zoomOut: false
  };

  function HeroShader() {
    const [heroVisible, setHeroVisible] = React.useState(true);
    const [pageVisible, setPageVisible] = React.useState(!document.hidden);

    React.useEffect(() => {
      if (!('IntersectionObserver' in window)) {
        return undefined;
      }

      const observer = new IntersectionObserver(([entry]) => {
        setHeroVisible(entry.isIntersecting && entry.intersectionRatio > 0.01);
      }, { threshold: [0, 0.01, 0.15] });

      observer.observe(mount);
      return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
      const handleVisibility = () => setPageVisible(!document.hidden);
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    const running = !prefersReducedMotion && heroVisible && pageVisible;

    return React.createElement(
      ShaderGradientCanvas,
      {
        style: {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        },
        pixelDensity: 1,
        fov: 140
      },
      React.createElement(ShaderGradient, {
        ...shaderProps,
        animate: running ? 'on' : 'off',
        uSpeed: running ? shaderSpeed : 0
      })
    );
  }

  try {
    createRoot(mount).render(React.createElement(HeroShader));
  } catch (error) {
    mount.classList.add('hero-shader-gradient--failed');
    console.warn('Hero ShaderGradient failed to initialize.', error);
  }
}
