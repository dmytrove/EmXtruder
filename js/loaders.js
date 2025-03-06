import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { params } from './config.js';
import { distributions } from './distributions.js';

const loader = new GLTFLoader();
window.loadedCount = 0;
window.failedCount = 0;
window.totalToLoad = 0;
window.allGlbFiles = [];

export async function loadGlbFilesFromCSV() {
  try {
    const response = await fetch('./data/glb_files.csv');
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status}`);
    }
    const csvText = await response.text();
    const rows = csvText.split('\n');
    window.allGlbFiles = [];
    // Only load the CSV files if we're not using custom emojis
    if (!params.useCustomEmojis) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        const columns = row.match(/("[^"]+"|[^,]+)/g);
        if (columns && columns.length >= 2) {
          const filename = columns[1].replace(/"/g, '').trim();
          if (filename.endsWith('.glb')) {
            window.allGlbFiles.push(filename);
          }
        }
      }
      console.log(`Loaded ${window.allGlbFiles.length} GLB files from CSV`);
      if (window.allGlbFiles.length === 0) {
        console.error('No GLB files found in CSV file');
        displayLoadingError('No GLB files found in CSV file');
        return;
      }
    }

    window.loadedCount = 0;
    window.failedCount = 0;
    
    let selectedFiles;
    if (params.useCustomEmojis) {
      if (params.customEmojis.length === 0) {
        console.warn('Custom emojis enabled but none provided');
        displayLoadingError('Please enter custom emoji filenames');
        return;
      }
      // Validate that at least one custom emoji file exists
      try {
        const testResponse = await fetch(`./glb_flat/${params.customEmojis[0]}`);
        if (!testResponse.ok) {
          console.error('Custom emoji file not found:', params.customEmojis[0]);
          displayLoadingError('One or more custom emoji files not found. Check filenames.');
          return;
        }
      } catch (error) {
        console.error('Error validating custom emoji file:', error);
        displayLoadingError('Error validating custom emoji files');
        return;
      }
      selectedFiles = shuffle([...params.customEmojis]).slice(0, params.modelCount);
    } else {
      selectedFiles = shuffle([...window.allGlbFiles]).slice(0, params.modelCount);
    }
    
    window.totalToLoad = selectedFiles.length;
    loadModels(selectedFiles);
  } catch (error) {
    console.error('Error loading CSV file:', error);
    displayLoadingError('Failed to load GLB files list from CSV');
  }
}

function displayLoadingError(errorMessage) {
  console.error(errorMessage);
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'absolute';
  errorDiv.style.top = '50%';
  errorDiv.style.left = '50%';
  errorDiv.style.transform = 'translate(-50%, -50%)';
  errorDiv.style.color = 'red';
  errorDiv.style.fontSize = '24px';
  errorDiv.style.fontWeight = 'bold';
  errorDiv.style.background = 'rgba(0,0,0,0.7)';
  errorDiv.style.padding = '20px';
  errorDiv.style.borderRadius = '10px';
  errorDiv.textContent = errorMessage;
  document.body.appendChild(errorDiv);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function loadModels(fileList) {
  const scene = window.scene;
  const models = window.models;
  
  if (!scene) {
    console.error("Scene not initialized");
    return;
  }
  
  fileList.forEach((fileName) => {
    loader.load(
      `./glb_flat/${fileName}`,
      function (gltf) {
        const model = gltf.scene;
        model.userData.fileName = fileName;
        model.scale.set(params.scaleMultiplier, params.scaleMultiplier, params.scaleMultiplier);
        const distribute = distributions[params.distribution];
        const position = distribute ? distribute(models.length, params.modelCount) : new THREE.Vector3();
        model.position.copy(position);
        model.userData.originalPosition = position.clone();
        model.userData.rotationAxis = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize();
        model.userData.rotationSpeed = Math.random() * 0.01 + 0.002;
        model.userData.initialAngle = Math.random() * Math.PI * 2;
        const box = new THREE.Box3().setFromObject(model);
        const boxHelper = new THREE.Box3Helper(box, 0xffff00);
        boxHelper.visible = params.showBoundingBoxes;
        scene.add(boxHelper);
        model.userData.boxHelper = boxHelper;
        model.traverse(child => {
          if (child.isMesh) {
            child.userData.originalMaterial = child.material.clone();
            const materialOpts = params.materialOptions[params.material];
            child.material = new THREE.MeshPhysicalMaterial({
              color: child.userData.originalMaterial.color,
              ...materialOpts,
              side: THREE.DoubleSide
            });
          }
        });
        scene.add(model);
        models.push(model);
        window.loadedCount++;
        const size = new THREE.Vector3();
        box.getSize(size);
        console.log(`Loaded model: ${fileName} (${window.loadedCount}/${params.modelCount})`);
        console.log(`Model dimensions: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
      },
      function (progress) {
        const percent = (progress.loaded / progress.total) * 100;
        if (percent === 100 || percent % 25 === 0) {
          console.log(`Loading ${fileName}: ${percent.toFixed(0)}%`);
        }
      },
      function (error) {
        console.warn(`File not found or error loading ${fileName}`, error.message);
        window.failedCount++;
        if (window.loadedCount < params.modelCount) {
          setTimeout(() => tryLoadAdditionalModels(), 0);
        }
      }
    );
  });
}

function tryLoadAdditionalModels() {
  const models = window.models || [];
  
  if (window.loadedCount < params.modelCount) {
    const remainingToLoad = params.modelCount - window.loadedCount;
    let sourceFiles;
    
    if (params.useCustomEmojis) {
      if (params.customEmojis.length === 0) {
        console.warn('No custom emojis available for additional loading');
        return;
      }
      sourceFiles = params.customEmojis;
    } else {
      if (window.loadedCount + window.failedCount >= window.allGlbFiles.length) {
        console.warn('No more files available to load');
        return;
      }
      sourceFiles = window.allGlbFiles;
    }
    
    const additionalFiles = shuffle([...sourceFiles])
      .filter(file => !models.some(m => m.userData && m.userData.fileName === file))
      .slice(0, remainingToLoad + 5);

    if (additionalFiles.length > 0) {
      console.log(`Trying to load ${additionalFiles.length} additional models`);
      loadModels(additionalFiles);
    } else {
      console.warn(`Only able to load ${window.loadedCount} out of ${params.modelCount} requested models`);
    }
  }
}