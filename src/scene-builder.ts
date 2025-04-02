import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PCFShadowMap,
  EquirectangularReflectionMapping,
  BoxGeometry,
  MeshStandardMaterial,
  Mesh,
  DoubleSide,
  PlaneGeometry,
  AmbientLight,
  DirectionalLight,
  CircleGeometry,
  CylinderGeometry
} from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import {
  buildingHeight, buildingSize, parkSize, playerHeight, muretHeight
} from './constants';

// Store scene and renderer globally to be accessible by functions
let globalScene: Scene;
let globalRenderer: WebGLRenderer;

/**
 * Creates and initializes the main scene
 */
export function createScene() {
  const scene = new Scene();
  globalScene = scene;
  
  // Setup lighting
  setupLighting(scene);
  
  // Create environment
  createEnvironment(scene);
  
  return scene;
}

/**
 * Set up the scene lighting
 */
function setupLighting(scene: Scene) {
  // Ambient light
  const ambientLight = new AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Directional light (sun)
  const directionalLight = new DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 15, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // Set up light shadow properties
  directionalLight.shadow.camera.left = -parkSize / 2;
  directionalLight.shadow.camera.right = parkSize / 2;
  directionalLight.shadow.camera.top = parkSize / 2;
  directionalLight.shadow.camera.bottom = -parkSize / 2;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
}

/**
 * Create the environment (ground, buildings, etc)
 */
function createEnvironment(scene: Scene) {
  // Ground
  const groundGeometry = new PlaneGeometry(parkSize, parkSize);
  const groundMaterial = new MeshStandardMaterial({ 
    color: 0x42a830, 
    side: DoubleSide,
    roughness: 0.8 
  });
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Add buildings around the perimeter
  createBuildings(scene);
  
  // Add center platform
  createCenterPlatform(scene);
}

/**
 * Create buildings around the perimeter
 */
function createBuildings(scene: Scene) {
  const buildingGeometry = new BoxGeometry(buildingSize, buildingHeight, buildingSize);
  const buildingMaterial = new MeshStandardMaterial({ 
    color: 0x888888,
    roughness: 0.7 
  });
  
  // Calculate positions based on park size
  const halfPark = parkSize / 2;
  const positions = [];
  const spacing = buildingSize * 1.5;
  
  // Generate positions around the perimeter
  for (let x = -halfPark + spacing/2; x < halfPark; x += spacing) {
    positions.push({ x, z: -halfPark + buildingSize/2 });
    positions.push({ x, z: halfPark - buildingSize/2 });
  }
  
  for (let z = -halfPark + spacing/2; z < halfPark; z += spacing) {
    positions.push({ x: -halfPark + buildingSize/2, z });
    positions.push({ x: halfPark - buildingSize/2, z });
  }
  
  // Create buildings at each position
  positions.forEach(pos => {
    const building = new Mesh(buildingGeometry, buildingMaterial);
    building.position.set(pos.x, buildingHeight / 2, pos.z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
  });
}

/**
 * Create the center platform
 */
function createCenterPlatform(scene: Scene) {
  // Base platform
  const platformRadius = 5;
  const platformGeometry = new CircleGeometry(platformRadius, 32);
  const platformMaterial = new MeshStandardMaterial({ 
    color: 0xcccccc,
    roughness: 0.6
  });
  const platform = new Mesh(platformGeometry, platformMaterial);
  platform.rotation.x = -Math.PI / 2;
  platform.position.y = 0.1;
  platform.receiveShadow = true;
  scene.add(platform);
  
  // Edge walls/muret
  const muretGeometry = new CylinderGeometry(
    platformRadius, 
    platformRadius, 
    muretHeight, 
    32, 
    1, 
    true
  );
  const muretMaterial = new MeshStandardMaterial({ 
    color: 0xaaaaaa, 
    roughness: 0.7,
    side: DoubleSide
  });
  const muret = new Mesh(muretGeometry, muretMaterial);
  muret.position.y = muretHeight / 2;
  muret.castShadow = true;
  muret.receiveShadow = true;
  scene.add(muret);
}

/**
 * Create and configure the renderer
 */
export function createRenderer() {
  const renderer = new WebGLRenderer({ antialias: true });
  globalRenderer = renderer;
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  
  // Load HDR environment map
  const rgbeLoader = new RGBELoader();
  rgbeLoader.load('envmap.hdr', (texture) => {
    texture.mapping = EquirectangularReflectionMapping;
    globalScene.environment = texture;
  });
  
  document.body.appendChild(renderer.domElement);
  
  return renderer;
}

/**
 * Create and configure the camera
 */
export function createCamera() {
  const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, playerHeight, 0);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    globalRenderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  return camera;
} 