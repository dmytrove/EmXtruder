import * as THREE from 'three';
import { params } from './config.js';

let currentEnvMapType = 'simple';
let currentEnvMap = null;

export function updateEnvironmentRotation(scene) {
  scene = scene || window.scene;
  if (!scene.environment) return;
  if (!scene.environment.userData) scene.environment.userData = {};
  const rotation = new THREE.Matrix4().makeRotationY(params.environment.rotation);
  scene.environment.userData.rotation = rotation;
  console.log('Updating environment rotation:', params.environment.rotation);
  scene.traverse(child => {
    if (child.material) {
      child.material.needsUpdate = true;
    }
  });
}

export function updateEnvironmentMap(scene, renderer, pmremGenerator) {
  // Use global objects if not provided
  scene = scene || window.scene;
  renderer = renderer || window.renderer;
  pmremGenerator = pmremGenerator || window.pmremGenerator;
  
  // Check if we have the necessary objects
  if (!renderer || !pmremGenerator) {
    console.error("Missing renderer or pmremGenerator for environment mapping");
    return;
  }

  const prevEnvMapType = currentEnvMapType;
  currentEnvMapType = params.environment.type;
  console.log('Updating environment map to:', params.environment.type);
  
  // Simple environment map with empty textures
  if (params.environment.type === 'simple') {
    try {
      const envTexture = new THREE.CubeTextureLoader().load([
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      ]);
      scene.environment = pmremGenerator.fromCubemap(envTexture).texture;
      currentEnvMap = scene.environment;
      console.log('Using simple environment map');
    } catch (e) {
      console.error("Error creating simple environment map:", e);
    }
  } else if (params.environment.type === 'procedural') {
    try {
      const rt = new THREE.WebGLCubeRenderTarget(256);
      rt.texture.type = THREE.HalfFloatType;
      const cubeCamera = new THREE.CubeCamera(0.1, 10, rt);
      const envScene = new THREE.Scene();
      const colors = [
        new THREE.Color(params.environment.colors.right),
        new THREE.Color(params.environment.colors.left),
        new THREE.Color(params.environment.colors.top),
        new THREE.Color(params.environment.colors.bottom),
        new THREE.Color(params.environment.colors.front),
        new THREE.Color(params.environment.colors.back)
      ];
      
      // Create a box with colored sides
      for (let i = 0; i < 6; i++) {
        const material = new THREE.MeshBasicMaterial({
          side: THREE.BackSide,
          color: colors[i],
          transparent: false
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), material);
        switch(i) {
          case 0: mesh.position.set(5, 0, 0); mesh.rotation.set(0, Math.PI/2, 0); break;
          case 1: mesh.position.set(-5, 0, 0); mesh.rotation.set(0, -Math.PI/2, 0); break;
          case 2: mesh.position.set(0, 5, 0); mesh.rotation.set(-Math.PI/2, 0, 0); break;
          case 3: mesh.position.set(0, -5, 0); mesh.rotation.set(Math.PI/2, 0, 0); break;
          case 4: mesh.position.set(0, 0, 5); mesh.rotation.set(0, 0, 0); break;
          case 5: mesh.position.set(0, 0, -5); mesh.rotation.set(0, Math.PI, 0); break;
        }
        envScene.add(mesh);
      }
      
      // Update the cube camera to capture the environment
      cubeCamera.update(renderer, envScene);
      scene.environment = pmremGenerator.fromCubemap(rt.texture).texture;
      currentEnvMap = scene.environment;
      console.log('Using procedural environment map');
    } catch (e) {
      console.error("Error creating procedural environment map:", e);
    }
  } else if (params.environment.type === 'colorful') {
    try {
      const rt = new THREE.WebGLCubeRenderTarget(256);
      rt.texture.type = THREE.HalfFloatType;
      const cubeCamera = new THREE.CubeCamera(0.1, 10, rt);
      const envScene = new THREE.Scene();
      
      // Create gradients for each side of the environment cube
      for (let i = 0; i < 6; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        let gradient;
        switch(i) {
          case 0: gradient = ctx.createLinearGradient(0, 0, 256, 256); gradient.addColorStop(0, params.environment.colors.right); gradient.addColorStop(1, params.environment.colors.top); break;
          case 1: gradient = ctx.createLinearGradient(0, 0, 256, 256); gradient.addColorStop(0, params.environment.colors.left); gradient.addColorStop(1, params.environment.colors.bottom); break;
          case 2: gradient = ctx.createLinearGradient(0, 0, 256, 256); gradient.addColorStop(0, params.environment.colors.top); gradient.addColorStop(1, params.environment.colors.front); break;
          case 3: gradient = ctx.createLinearGradient(0, 0, 256, 256); gradient.addColorStop(0, params.environment.colors.bottom); gradient.addColorStop(1, params.environment.colors.back); break;
          case 4: gradient = ctx.createLinearGradient(0, 0, 256, 256); gradient.addColorStop(0, params.environment.colors.front); gradient.addColorStop(1, params.environment.colors.right); break;
          case 5: gradient = ctx.createLinearGradient(0, 0, 256, 256); gradient.addColorStop(0, params.environment.colors.back); gradient.addColorStop(1, params.environment.colors.left); break;
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
          side: THREE.BackSide,
          map: texture
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), material);
        switch(i) {
          case 0: mesh.position.set(5, 0, 0); mesh.rotation.set(0, Math.PI/2, 0); break;
          case 1: mesh.position.set(-5, 0, 0); mesh.rotation.set(0, -Math.PI/2, 0); break;
          case 2: mesh.position.set(0, 5, 0); mesh.rotation.set(-Math.PI/2, 0, 0); break;
          case 3: mesh.position.set(0, -5, 0); mesh.rotation.set(Math.PI/2, 0, 0); break;
          case 4: mesh.position.set(0, 0, 5); mesh.rotation.set(0, 0, 0); break;
          case 5: mesh.position.set(0, 0, -5); mesh.rotation.set(0, Math.PI, 0); break;
        }
        envScene.add(mesh);
      }
      
      // Update the cube camera to capture the environment
      cubeCamera.update(renderer, envScene);
      scene.environment = pmremGenerator.fromCubemap(rt.texture).texture;
      currentEnvMap = scene.environment;
      console.log('Using colorful gradient environment map');
    } catch (e) {
      console.error("Error creating colorful environment map:", e);
    }
  }
  
  if (params.environment.rotation !== 0) {
    updateEnvironmentRotation(scene);
  }
  
  // Call updateMaterials only if we're not already in an updateMaterials call
  if (!window._updating_materials) {
    updateMaterials(scene);
  }
}

export function updateMaterials(scene) {
  scene = scene || window.scene;
  
  // Set a flag to prevent infinite recursion
  window._updating_materials = true;
  
  try {
    const materialOpts = params.materialOptions[params.material];
    const envIntensity = params.environment.intensity || 1.0;
    
    // Use window.models which is set in main.js
    const models = window.models || [];
    models.forEach(model => {
      model.traverse(child => {
        if (child.isMesh) {
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material.clone();
          }
          const newMaterial = new THREE.MeshPhysicalMaterial({
            color: child.userData.originalMaterial.color,
            ...materialOpts,
            envMapIntensity: materialOpts.envMapIntensity ? materialOpts.envMapIntensity * envIntensity : envIntensity,
            side: THREE.DoubleSide
          });
          if (materialOpts.glow) {
            newMaterial.emissive = child.userData.originalMaterial.color;
            newMaterial.emissiveIntensity = 0.5;
          }
          child.material = newMaterial;
        }
      });
    });
    
    // IMPORTANT: Remove this recursive call that was causing the infinite loop
    // if (params.envMapType !== currentEnvMapType) {
    //   updateEnvironmentMap(scene);
    // }
  } finally {
    // Always clear the flag when done
    window._updating_materials = false;
  }
}