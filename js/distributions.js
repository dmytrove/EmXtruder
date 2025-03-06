import * as THREE from 'three';
import { params } from './config.js';

// Distribution functions to position models in different formations
export const distributions = {
  random: (index, total) => {
    return new THREE.Vector3(
      (Math.random() - 0.5) * params.spacing * 2,
      (Math.random() - 0.5) * params.spacing * 2,
      (Math.random() - 0.5) * params.spacing * 2
    );
  },
  
  grid3d: (index, total) => {
    const gridSize = Math.ceil(Math.pow(total, 1/3));
    const spacing = params.spacing;
    
    const x = (index % gridSize - gridSize/2) * spacing;
    const y = (Math.floor(index/gridSize) % gridSize - gridSize/2) * spacing;
    const z = (Math.floor(index/(gridSize*gridSize)) - gridSize/2) * spacing;
    
    return new THREE.Vector3(x, y, z);
  },
  
  sphere: (index, total) => {
    const radius = params.spacing * 2;
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;
    
    return new THREE.Vector3(
      radius * Math.cos(theta) * Math.sin(phi),
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(phi)
    );
  },
  
  cylinder: (index, total) => {
    const radius = params.spacing * 2;
    const height = params.spacing * 4;
    const angle = (index / total) * Math.PI * 2;
    const y = (index / total - 0.5) * height;
    
    return new THREE.Vector3(
      radius * Math.cos(angle),
      y,
      radius * Math.sin(angle)
    );
  },
  
  spiral: (index, total) => {
    const radius = (index / total) * params.spacing * 4;
    const angle = (index / total) * Math.PI * 8;
    const y = (index / total - 0.5) * params.spacing * 4;
    
    return new THREE.Vector3(
      radius * Math.cos(angle),
      y,
      radius * Math.sin(angle)
    );
  },
  
  wave: (index, total) => {
    const spacing = params.spacing;
    const x = (index - total/2) * spacing;
    const z = (index % 2) * spacing - spacing/2;
    const y = Math.sin(x * 0.5) * spacing;
    
    return new THREE.Vector3(x, y, z);
  }
};