import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { params } from './config.js';
import { setupPostProcessing } from './postprocessing.js';
import { setupGUI } from './gui.js';
import { loadGlbFilesFromCSV, loadModels } from './loaders.js';
import { updateEnvironmentMap, updateEnvironmentRotation, updateMaterials } from './environment.js';
import { animations } from './animations.js';
import { distributions } from './distributions.js';

// Add the models array to a global scope
window.models = [];
window.scene = new THREE.Scene();

const scene = window.scene;
const models = window.models;
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
// Make renderer globally available
window.renderer = renderer;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add hemisphere light for better ambient illumination
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// Add reloadModels function to params object
params.reloadModels = function() {
  models.forEach(model => {
    scene.remove(model);
    if (model.userData.boxHelper) {
      scene.remove(model.userData.boxHelper);
    }
  });
  models.length = 0;
  window.loadedCount = 0;
  window.failedCount = 0;
  const allGlbFiles = window.allGlbFiles || [];
  const shuffle = function(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  const newFiles = shuffle([...allGlbFiles]).slice(0, params.modelCount);
  window.totalToLoad = newFiles.length;
  loadModels(newFiles);
};

const lights = [
  { color: 0xffffff, intensity: 1.3, position: [1, 1, 1] },
  { color: 0xffd4b4, intensity: 1.0, position: [-1, 0.5, -1] },
  { color: 0xb4d4ff, intensity: 1.0, position: [0, -1, 1] },
  { color: 0xff9966, intensity: 0.7, position: [1, -1, -1] },
  { color: 0x66ccff, intensity: 0.7, position: [-1, 1, -1] }
];
const directionalLights = [];
const directionalLightConfigs = [
  { color: 0xff0000, intensity: 0.5, position: [5, 0, 0] },
  { color: 0x00ff00, intensity: 0.5, position: [-5, 0, 0] },
  { color: 0x0000ff, intensity: 0.5, position: [0, 5, 0] },
  { color: 0xffff00, intensity: 0.5, position: [0, -5, 0] }
];
lights.forEach(light => {
  const directionalLight = new THREE.DirectionalLight(light.color, light.intensity);
  directionalLight.position.set(...light.position);
  scene.add(directionalLight);
});
const lightHelpers = [];
directionalLightConfigs.forEach(config => {
  const directionalLight = new THREE.DirectionalLight(config.color, config.intensity);
  directionalLight.position.set(...config.position);
  scene.add(directionalLight);
  directionalLights.push(directionalLight);
  const helper = new THREE.DirectionalLightHelper(directionalLight, 1);
  helper.visible = false;
  scene.add(helper);
  lightHelpers.push(helper);
});
const spotlight = new THREE.SpotLight(0xffffff, 1);
spotlight.position.set(0, 10, 0);
spotlight.angle = Math.PI / 4;
spotlight.penumbra = 0.1;
spotlight.decay = 2;
spotlight.distance = 200;
scene.add(spotlight);
const spotLightHelper = new THREE.SpotLightHelper(spotlight);
spotLightHelper.visible = false;
scene.add(spotLightHelper);
const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 5, 30);
controls.update();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
// Make pmremGenerator globally available
window.pmremGenerator = pmremGenerator;
pmremGenerator.compileEquirectangularShader();
const envTexture = new THREE.CubeTextureLoader().load([
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
]);
scene.environment = pmremGenerator.fromCubemap(envTexture).texture;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true;
const { composer, bloomPass, glowPass } = setupPostProcessing(renderer, scene, camera);
const gui = setupGUI(scene, models, lightHelpers, spotLightHelper, gridHelper);
loadGlbFilesFromCSV();
function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() * 0.001;
  models.forEach((model) => {
    const animationFunc = animations[params.animation];
    if (animationFunc) {
      animationFunc(model, time);
    }
    if (model.userData.rotationAxis) {
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationAxis(
        model.userData.rotationAxis,
        params.rotationSpeed
      );
      model.matrix.multiply(rotationMatrix);
      model.rotation.setFromRotationMatrix(model.matrix);
    }
    if (model.userData.boxHelper) {
      const box = new THREE.Box3().setFromObject(model);
      model.userData.boxHelper.box.copy(box);
    }
  });
  controls.update();
  composer.render();
}
animate();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
});
export function updateModels() {
  models.forEach(model => {
    model.scale.set(params.scaleMultiplier, params.scaleMultiplier, params.scaleMultiplier);
    if (model.userData.boxHelper) {
      const box = new THREE.Box3().setFromObject(model);
      model.userData.boxHelper.box.copy(box);
    }
  });
}
export function updateBoundingBoxes() {
  models.forEach(model => {
    if (model.userData.boxHelper) {
      model.userData.boxHelper.visible = params.showBoundingBoxes;
    }
  });
}
export function updateLightIntensity(value) {
  scene.children.forEach(child => {
    if (child instanceof THREE.Light) {
      child.intensity = value;
    }
  });
}
export function updateModelPositions() {
  console.log('Updating positions with distribution:', params.distribution);
  const distribute = distributions[params.distribution];
  if (!distribute) {
    console.error('Invalid distribution:', params.distribution);
    return;
  }
  models.forEach((model, index) => {
    const position = distribute(index, models.length);
    if (position) {
      model.position.copy(position);
      model.userData.originalPosition = position.clone();
      model.userData.initialAngle = (index / models.length) * Math.PI * 2;
    }
  });
}
export function reloadModels() {
  models.forEach(model => {
    scene.remove(model);
    if (model.userData.boxHelper) {
      scene.remove(model.userData.boxHelper);
    }
  });
  models.length = 0;
  window.loadedCount = 0;
  window.failedCount = 0;

  let selectedFiles;
  if (params.useCustomEmojis && params.customEmojis.length > 0) {
    // Use only the specified custom emojis
    selectedFiles = shuffle([...params.customEmojis]).slice(0, params.modelCount);
    console.log('Loading custom emojis:', selectedFiles);
  } else {
    // Use random emojis from the full set
    const allGlbFiles = window.allGlbFiles || [];
    selectedFiles = shuffle([...allGlbFiles]).slice(0, params.modelCount);
  }
  
  window.totalToLoad = selectedFiles.length;
  loadModels(selectedFiles);
}