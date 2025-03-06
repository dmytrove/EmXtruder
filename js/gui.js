import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { params } from './config.js';
import { updateModels, updateBoundingBoxes, updateLightIntensity, updateModelPositions } from './main.js';
import { updateEnvironmentMap, updateEnvironmentRotation, updateMaterials } from './environment.js';
import { animations } from './animations.js';

export function setupGUI(scene, models, lightHelpers, spotLightHelper, gridHelper) {
  const gui = new GUI();

  // Add custom emoji controls
  const emojiFolder = gui.addFolder('Emoji Selection');
  
  const customEmojiInput = document.createElement('input');
  customEmojiInput.type = 'text';
  customEmojiInput.placeholder = 'Enter emoji filenames (comma-separated)';
  customEmojiInput.style.width = '100%';
  customEmojiInput.style.marginBottom = '10px';
  
  emojiFolder.add(params, 'useCustomEmojis').name('Use Custom Emojis')
    .onChange((value) => {
      if (!value) {
        customEmojiInput.value = '';
        params.customEmojis = [];
      }
      params.reloadModels();
    });

  customEmojiInput.addEventListener('change', (e) => {
    const filenames = e.target.value.split(',')
      .map(f => f.trim())
      .filter(f => f)
      .map(f => f.endsWith('.glb') ? f : `emoji_${f}.glb`);
    
    if (filenames.length > 100) {
      alert('Maximum 100 custom emojis allowed');
      filenames.length = 100;
    }
    
    params.customEmojis = filenames;
    if (params.useCustomEmojis) {
      params.reloadModels();
    }
  });
  emojiFolder.domElement.appendChild(customEmojiInput);
  
  // Add model count control
  emojiFolder.add(params, 'modelCount', 1, 100, 1)
    .name('Number to Display')
    .onChange(() => params.reloadModels());

  gui.add(params, 'scaleMultiplier', 1, 100, 1).name('Scale').onChange(updateModels);
  gui.add(params, 'showGrid').name('Show Grid').onChange(value => {
    gridHelper.visible = value;
  });
  gui.add(params, 'showBoundingBoxes').name('Show Boxes').onChange(updateBoundingBoxes);
  gui.add(params, 'showLightHelpers').name('Show Light Helpers').onChange(value => {
    lightHelpers.forEach(helper => helper.visible = value);
    spotLightHelper.visible = value;
  });
  gui.addColor(params, 'backgroundColor').name('Background').onChange(value => {
    scene.background = new THREE.Color(value);
  });
  gui.add(params, 'lightIntensity', 0, 2, 0.1).name('Light').onChange(value => {
    updateLightIntensity(value);
  });
  gui.add(params, 'material', [
    'glass', 'metal', 'plastic', 'crystal', 'holographic', 
    'neon', 'pearl', 'chrome', 'opal', 'liquid', 'plasma', 'rainbow'
  ]).name('Material').onChange(updateMaterials);
  gui.add(params, 'spacing', 2, 15, 0.5).name('Spacing').onChange(updateModelPositions);
  gui.add(params, 'rotationSpeed', 0, 0.05, 0.001).name('Rotation Speed');
  gui.add(params, 'modelCount', 1, 500, 1).name('Model Count');
  const envFolder = gui.addFolder('Environment Map');
  envFolder.add(params.environment, 'type', ['simple', 'procedural', 'colorful']).name('Type')
    .onChange(() => updateEnvironmentMap());
  envFolder.add(params.environment, 'intensity', 0, 3, 0.1).name('Intensity')
    .onChange(() => updateMaterials());
  envFolder.add(params.environment, 'rotation', 0, Math.PI * 2, 0.01).name('Rotation')
    .onChange(() => updateEnvironmentRotation());
  const envColorFolder = envFolder.addFolder('Environment Colors');
  envColorFolder.addColor(params.environment.colors, 'top').name('Top')
    .onChange(() => updateEnvironmentMap());
  envColorFolder.addColor(params.environment.colors, 'bottom').name('Bottom')
    .onChange(() => updateEnvironmentMap());
  envColorFolder.addColor(params.environment.colors, 'front').name('Front')
    .onChange(() => updateEnvironmentMap());
  envColorFolder.addColor(params.environment.colors, 'back').name('Back')
    .onChange(() => updateEnvironmentMap());
  envColorFolder.addColor(params.environment.colors, 'left').name('Left')
    .onChange(() => updateEnvironmentMap());
  envColorFolder.addColor(params.environment.colors, 'right').name('Right')
    .onChange(() => updateEnvironmentMap());
  
  gui.add(params, 'reloadModels').name('Reload Models');
  
  const distributionFolder = gui.addFolder('Distribution');
  distributionFolder.add(params, 'distribution', [
    'random',
    'grid3d',
    'sphere',
    'cylinder',
    'spiral',
    'wave'
  ]).name('Distribution')
    .onChange(() => {
      console.log('Changing distribution to:', params.distribution);
      updateModelPositions();
    });
  const animationFolder = gui.addFolder('Animation');
  animationFolder.add(params, 'animation', 
    Object.fromEntries(Object.entries(params.animationOptions).map(([k, v]) => [k, v.name]))
  ).onChange(() => {
    console.log('Changing animation to:', params.animation);
    // Reset all models to their original positions and update initial angles
    models.forEach((model, index) => {
      if (model.userData.originalPosition) {
        model.position.copy(model.userData.originalPosition);
        // Ensure initial angle is set for animations that need it
        model.userData.initialAngle = (index / models.length) * Math.PI * 2;
      }
    });
    // Force an immediate animation update
    const time = Date.now() * 0.001;
    const animationFunc = animations[params.animation];
    if (animationFunc) {
      models.forEach(model => animationFunc(model, time));
    }
  });
  
  // Add hemisphere light controls
  const hemiLightFolder = gui.addFolder('Hemisphere Light');
  hemiLightFolder.add(params, 'hemiLightIntensity', 0, 2).name('Intensity').onChange(value => {
    const hemiLight = scene.children.find(child => child instanceof THREE.HemisphereLight);
    if (hemiLight) hemiLight.intensity = value;
  });
  hemiLightFolder.addColor(params, 'hemiSkyColor').name('Sky Color').onChange(value => {
    const hemiLight = scene.children.find(child => child instanceof THREE.HemisphereLight);
    if (hemiLight) hemiLight.color.set(value);
  });
  hemiLightFolder.addColor(params, 'hemiGroundColor').name('Ground Color').onChange(value => {
    const hemiLight = scene.children.find(child => child instanceof THREE.HemisphereLight);
    if (hemiLight) hemiLight.groundColor.set(value);
  });

  return gui;
}