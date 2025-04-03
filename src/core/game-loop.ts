import {
  PerspectiveCamera,
  WebGLRenderer,
  Raycaster,
  Vector2,
  Clock
} from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Scene } from '../types/interfaces';
import { updateParticles } from './game-effects';
import { updateTimerDisplay, gameOver, setAimingState } from '../components/game-ui';
import { defaultFov } from '../constants/constants';

const clock = new Clock();
const raycaster = new Raycaster();
const mouse = new Vector2();
let gameActive = false;
let timeLeft = 60;
let isAiming = false;

export function initializeGameLoop(
  scene: Scene,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  controls: PointerLockControls
) {
  requestAnimationFrame(time => animate(time, scene, camera, renderer, controls));
  setupAiming(camera);
  resetTimer();
}

function animate(
  _time: number,
  scene: Scene,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  controls: PointerLockControls
) {
  requestAnimationFrame(time => animate(time, scene, camera, renderer, controls));

  if (gameActive) {
    timeLeft -= clock.getDelta();
    updateTimerDisplay(timeLeft);

    if (timeLeft <= 0) {
      gameOver('time');
      gameActive = false;
    }

    if (camera.position.y < -5) {
      gameOver('fell');
      gameActive = false;
    }
  }
  updateParticles(scene);
  updateTargets();
  renderer.render(scene, camera);
}

function setupAiming(camera: PerspectiveCamera) {
  document.addEventListener('mousedown', event => {
    if (!gameActive || event.button !== 2) return;
    isAiming = true;
    setAimingState(true);
    camera.fov = defaultFov / 2;
    camera.updateProjectionMatrix();
  });

  document.addEventListener('mouseup', event => {
    if (!gameActive || event.button !== 2 || !isAiming) return;
    isAiming = false;
    setAimingState(false);
    camera.fov = defaultFov;
    camera.updateProjectionMatrix();
  });

  document.addEventListener('click', () => {
    if (gameActive) raycaster.setFromCamera(mouse, camera);
  });
}

function updateTargets() { }

export function resetTimer() {
  timeLeft = 60;
  clock.start();
}

export function startGame() {
  gameActive = true;
  resetTimer();
}

export function stopGame() {
  gameActive = false;
}