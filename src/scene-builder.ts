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
  buildingHeight, buildingSize, parkSize, playerHeight, muretHeight, shadowCamSize
} from './constants';

let globalScene: Scene;
let globalRenderer: WebGLRenderer;

export function createScene() {
  const scene = new Scene();
  globalScene = scene;

  setupLighting(scene);
  createEnvironment(scene);

  return scene;
}

function setupLighting(scene: Scene) {
  const ambientLight = new AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 15, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;

  directionalLight.shadow.camera.left = -shadowCamSize;
  directionalLight.shadow.camera.right = shadowCamSize;
  directionalLight.shadow.camera.top = shadowCamSize;
  directionalLight.shadow.camera.bottom = -shadowCamSize;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;

  scene.add(directionalLight);
}

function createEnvironment(scene: Scene) {
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

  createBuildings(scene);
  createCenterPlatform(scene);
}

function createBuildings(scene: Scene) {
  const buildingGeometry = new BoxGeometry(buildingSize, buildingHeight, buildingSize);
  const buildingMaterial = new MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.7
  });

  const halfPark = parkSize / 2;
  const positions = [];
  const spacing = buildingSize * 1.5;

  for (let x = -halfPark + spacing / 2; x < halfPark; x += spacing) {
    positions.push({ x, z: -halfPark + buildingSize / 2 });
    positions.push({ x, z: halfPark - buildingSize / 2 });
  }

  for (let z = -halfPark + spacing / 2; z < halfPark; z += spacing) {
    positions.push({ x: -halfPark + buildingSize / 2, z });
    positions.push({ x: halfPark - buildingSize / 2, z });
  }

  positions.forEach(pos => {
    const building = new Mesh(buildingGeometry, buildingMaterial);
    building.position.set(pos.x, buildingHeight / 2, pos.z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
  });
}

function createCenterPlatform(scene: Scene) {
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

export function createRenderer() {
  const renderer = new WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  globalRenderer = renderer;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const rgbeLoader = new RGBELoader();
  rgbeLoader.load('envmap.hdr', (texture) => {
    texture.mapping = EquirectangularReflectionMapping;
    globalScene.environment = texture;
  });

  document.body.appendChild(renderer.domElement);

  return renderer;
}

export function createCamera() {
  const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, playerHeight, 0);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    globalRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  return camera;
}