import * as THREE from 'three';
import { params } from './config.js';

// Animation functions that can be applied to models
export const animations = {
    wave: (model, time) => {
        if (!model.userData.originalPosition) return;
        const pos = model.userData.originalPosition;
        const offset = model.userData.initialAngle || 0;
        model.position.y = pos.y + Math.sin(time * params.waveSpeed + offset) * params.waveHeight;
    },

    spiral: (model, time) => {
        if (!model.userData.originalPosition || model.userData.initialAngle === undefined) return;
        const pos = model.userData.originalPosition;
        const angle = model.userData.initialAngle + time * params.spiralSpeed;
        const radius = pos.length();
        model.position.x = Math.cos(angle) * radius;
        model.position.z = Math.sin(angle) * radius;
        model.position.y = pos.y + Math.sin(time * params.spiralSpeed) * 2;
    },

    orbit: (model, time) => {
        if (!model.userData.originalPosition || model.userData.initialAngle === undefined) return;
        const pos = model.userData.originalPosition;
        const angle = model.userData.initialAngle + time * params.orbitSpeed;
        const radius = pos.length();
        model.position.x = Math.cos(angle) * radius;
        model.position.z = Math.sin(angle) * radius;
        // Keep original Y position
        model.position.y = pos.y;
    }
};