// Import the material options from materials.js
import { materialOptions } from './materials.js';

// Configuration parameters for the 3D viewer
export const params = {
  scaleMultiplier: 100.0, // Default scale increased to 100
  showGrid: true,
  showBoundingBoxes: false,
  showLightHelpers: false,
  backgroundColor: '#000000',
  lightIntensity: 1.3, // Light set to 1.3
  hemiLightIntensity: 1.0, // Hemisphere light intensity
  hemiSkyColor: '#ffffff', // Sky color for hemisphere light
  hemiGroundColor: '#444444', // Ground color for hemisphere light
  spacing: 6,
  rotationSpeed: 0.005,
  modelCount: 20, // Default model count set to 20
  customEmojis: [], // Array to store custom emoji filenames
  useCustomEmojis: false, // Flag to toggle custom emoji selection
  distribution: 'random', // New distribution parameter
  material: 'plastic', // Default material set to plastic
  // Include the material options in the params object
  materialOptions,
  environment: {
    type: 'simple', // Environment map type
    intensity: 1.0,  // Environment map intensity
    colors: {          // Colors for procedural environment map
      top: '#0077ff',    // blue
      bottom: '#ff7700',  // orange
      front: '#00ff77',   // green
      back: '#ff0077',    // pink
      left: '#7700ff',    // purple  
      right: '#ffff00'    // yellow
    },
    rotation: 0,        // Environment map rotation
  },
  animation: 'wave',
  animationOptions: {
    wave: { name: 'Wave' },
    spiral: { name: 'Spiral' },
    orbit: { name: 'Orbit' }
  },
  waveSpeed: 1.0,
  waveHeight: 2.0,
  spiralSpeed: 0.5,
  orbitSpeed: 0.5,
  distributionOptions: {
    random: { name: 'Random', key: 'random' },
    grid3d: { name: '3D Grid', key: 'grid3d', size: 3 },
    sphere: { name: 'Sphere', key: 'sphere', radius: 5 },
    cylinder: { name: 'Cylinder', key: 'cylinder', radius: 5, height: 10 },
    spiral: { name: 'Spiral', key: 'spiral', turns: 2, height: 10 },
    wave: { name: 'Wave', key: 'wave', frequency: 0.5, amplitude: 2 }
  }
};