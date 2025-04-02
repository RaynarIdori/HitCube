import {
  PerspectiveCamera,
  WebGLRenderer,
  Raycaster,
  Vector2,
  Clock
} from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Scene } from './interfaces';
import { updateParticles } from './game-effects';
import { updateTimerDisplay, gameOver, setAimingState } from './game-ui';
import { defaultFov } from './constants';

// Game state
let gameActive = false;
let timeLeft = 60;
const clock = new Clock();
const raycaster = new Raycaster();
const mouse = new Vector2();
let isAiming = false;

/**
 * Initialize the game loop
 */
export function initializeGameLoop(
  scene: Scene, 
  camera: PerspectiveCamera, 
  renderer: WebGLRenderer,
  controls: PointerLockControls
) {
  // Start animation loop
  animate(0, scene, camera, renderer, controls);
  
  // Set up aiming
  setupAiming(camera);
  
  // Reset timer
  resetTimer();
}

/**
 * Main animation/game loop
 */
function animate(
  _time: number, 
  scene: Scene, 
  camera: PerspectiveCamera, 
  renderer: WebGLRenderer,
  controls: PointerLockControls
) {
  requestAnimationFrame((time) => animate(time, scene, camera, renderer, controls));
  
  // Update game state
  if (gameActive) {
    // Update timer
    timeLeft -= clock.getDelta();
    updateTimerDisplay(timeLeft);
    
    // Check for game over
    if (timeLeft <= 0) {
      gameOver('time');
      gameActive = false;
    }
    
    // Check player position (fell out of arena)
    if (camera.position.y < -5) {
      gameOver('fell');
      gameActive = false;
    }
  }
  
  // Update particles
  updateParticles(scene);
  
  // Update targets if any
  updateTargets();
  
  // Render scene
  renderer.render(scene, camera);
}

/**
 * Set up aiming system
 */
function setupAiming(camera: PerspectiveCamera) {
  // Handle mouse events
  document.addEventListener('mousedown', (event) => {
    if (!gameActive) return;
    
    // Only handle right mouse button (aiming)
    if (event.button === 2) {
      isAiming = true;
      setAimingState(true);
      
      // Zoom in camera (reduce FOV)
      camera.fov = defaultFov / 2;
      camera.updateProjectionMatrix();
    }
  });
  
  document.addEventListener('mouseup', (event) => {
    if (!gameActive) return;
    
    // End aiming
    if (event.button === 2 && isAiming) {
      isAiming = false;
      setAimingState(false);
      
      // Reset FOV
      camera.fov = defaultFov;
      camera.updateProjectionMatrix();
    }
  });
  
  // Handle click for shooting
  document.addEventListener('click', () => {
    if (!gameActive) return;
    
    // Cast ray to detect targets
    raycaster.setFromCamera(mouse, camera);
    
    // ... target handling would go here
  });
}

/**
 * Update all targets in the scene (stub for now)
 */
function updateTargets() {
  // This would be implemented based on target-manager.ts
}

/**
 * Reset timer for new game
 */
export function resetTimer() {
  timeLeft = 60;
  clock.start();
}

/**
 * Start the game
 */
export function startGame() {
  gameActive = true;
  resetTimer();
}

/**
 * Stop the game
 */
export function stopGame() {
  gameActive = false;
} 