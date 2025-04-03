import './assets/style.css'
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
  Group,
  Vector3,
  Raycaster,
  Vector2,
  MeshBasicMaterial,
  SphereGeometry,
  Clock,
  CircleGeometry,
  CylinderGeometry
} from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { ExplosionParticle, Target } from './types/interfaces';
import {
  buildingHeight, buildingSize, parkSize, playerHeight, muretHeight, muretThickness,
  defaultFov, particleLife, particleSpeed,
  playerMoveSpeed, fovLerpFactor, fenceHeight, shadowCamSize
} from './constants/constants';
import { initializeTextures, brickTexture, concreteTexture, grassTexture, fenceTexture, willowTexture, leafTexture } from './managers/texture-manager';
import { initializeCommandHandling, CommandState } from './core/commands';
import { initializeTargets, updateTargets, getTargets, handleTargetHit as importedHandleTargetHit, checkAndSpawnTarget as importedCheckAndSpawnTarget } from './managers/target-manager';
import Stats from 'stats.js';

const scene = new Scene()

document.head.insertAdjacentHTML('beforeend', `
  <style>
    body, #score-display, #timer-display, #instructions, #objective-display, 
    #game-over, #start-screen, .scope-line, #sniper-pov,
    .game-over-content, .start-content, h2, p, span, div {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      cursor: default;
    }
    img, canvas {
      user-drag: none;
      -webkit-user-drag: none;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    #timer-display {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 24px;
      font-weight: bold;
      z-index: 100;
    }
    #timer-display.warning { color: #ff9900; }
    #timer-display.danger { color: #ff0000; }
  </style>
`);

const stats = new Stats();
stats.showPanel(0);
stats.dom.style.position = 'absolute';
stats.dom.style.right = '0px';
stats.dom.style.bottom = '0px';
stats.dom.style.left = 'auto';
stats.dom.style.top = 'auto';
document.body.appendChild(stats.dom);

const scoreDisplay = document.createElement('div');
scoreDisplay.id = 'score-display';
scoreDisplay.innerHTML = 'Score: 0';
document.body.appendChild(scoreDisplay);

const timerDisplay = document.createElement('div');
timerDisplay.id = 'timer-display';
timerDisplay.innerHTML = '30.0';
document.body.appendChild(timerDisplay);

const gameOverScreen = document.createElement('div');
gameOverScreen.id = 'game-over';
gameOverScreen.innerHTML = `
  <div class="game-over-content">
    <h2 id="game-over-reason">Vous avez eliminé la mauvaise cible !</h2>
    <p>Score final: <span id="final-score">0</span></p>
    <p>Meilleur score: <span id="best-score">0</span></p>
    <p><i>Redémarrage dans 5 secondes...</i></p>
  </div>
`;
gameOverScreen.style.display = 'none';
document.body.appendChild(gameOverScreen);

const startScreen = document.createElement('div');
startScreen.id = 'start-screen';
startScreen.innerHTML = `
  <div class="start-content">
    <h2>Cliquez pour commencer la partie</h2>
    <p><i>Vous avez 30 secondes pour éliminer la cible designée</i></p>
  </div>
`;
document.body.appendChild(startScreen);

let score = 0;
let isGameOver = false;
let isGameStarted = false;
let canShoot = true;
let timeRemaining = 30.0;
let currentTargetTimer = 30.0;

const camera = new PerspectiveCamera(defaultFov, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = PCFShadowMap
document.body.appendChild(renderer.domElement)

const rgbeLoader = new RGBELoader();
rgbeLoader.setPath('textures/');
rgbeLoader.load('sky.hdr', (texture) => {
  texture.mapping = EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture;
}, undefined, (error) => {
  console.error('Erreur chargement skybox HDR :', error);
});

initializeTextures({
  buildingSize,
  muretHeight,
  parkSize
});

initializeTargets(scene);

const raycaster = new Raycaster()
const mouse = new Vector2()

const controls = new PointerLockControls(camera, document.body)
scene.add(controls.object)

let commandState: CommandState;
commandState = initializeCommandHandling(controls, camera);

const instructions = document.createElement('div')
instructions.id = 'instructions'
instructions.innerHTML = '<b>Espace</b> pour Viser/Déviser<br/>Déplacement : <b>ZQSD/WASD/Flèches</b><br/>Tirer : <b>Clic Gauche</b> (en visant)'
document.body.appendChild(instructions)
instructions.style.display = 'none';

camera.fov = defaultFov;
camera.updateProjectionMatrix();

controls.addEventListener('lock', () => {
  document.body.classList.add('pointer-locked');
});

controls.addEventListener('unlock', () => {
  document.body.classList.remove('pointer-locked');
});

const explosionParticles: ExplosionParticle[] = [];
const particleMaterial = new MeshBasicMaterial({ color: 0xff0000, transparent: true });
const particleGeometry = new SphereGeometry(0.1, 4, 2);

const decalMaterial = new MeshBasicMaterial({
  color: 0xaa0000,
  transparent: true,
  opacity: 0.8,
  side: DoubleSide,
  depthWrite: false
});
const decalGeometry = new CircleGeometry(0.5, 16);

let audioContext: AudioContext | null = null;
let audioSources = new Map<string, MediaElementAudioSourceNode>();

function createExplosion(position: Vector3) {
  const numParticles = 30;
  for (let i = 0; i < numParticles; i++) {
    const particleMesh = new Mesh(particleGeometry, particleMaterial.clone());
    particleMesh.position.copy(position).add(new Vector3(0, 0.5, 0));
    const velocity = new Vector3(
      (Math.random() - 0.5),
      (Math.random() * 0.8),
      (Math.random() - 0.5)
    );
    velocity.normalize().multiplyScalar(particleSpeed * (Math.random() * 0.6 + 0.7));

    const life = particleLife * (Math.random() * 0.6 + 0.6);

    explosionParticles.push({
      mesh: particleMesh,
      velocity: velocity,
      timeCreated: Date.now(),
      life: life,
      initialLife: life
    });
    scene.add(particleMesh);
  }

  const decalMesh = new Mesh(decalGeometry, decalMaterial.clone());
  decalMesh.position.set(position.x, 0.01, position.z);
  decalMesh.rotation.x = -Math.PI / 2;
  decalMesh.renderOrder = 1;
  scene.add(decalMesh);
}

function updateScore(points: number) {
  score += points;
  scoreDisplay.innerHTML = `Score: ${score}`;
}

function gameOver(reason = 'time') {
  isGameOver = true;
  isGameStarted = false;
  controls.unlock();

  const gameOverReasonElement = document.getElementById('game-over-reason');
  if (gameOverReasonElement) {
    gameOverReasonElement.textContent = reason === 'time'
      ? "Vous n'avez pas réussi la mission !"
      : "Vous avez eliminé la mauvaise cible !";
  }

  const finalScoreElement = document.getElementById('final-score');
  if (finalScoreElement) {
    finalScoreElement.textContent = score.toString();
  }

  const bestScore = parseInt(localStorage.getItem('bestScore') || '0');
  if (score > bestScore) {
    localStorage.setItem('bestScore', score.toString());
  }

  const bestScoreElement = document.getElementById('best-score');
  if (bestScoreElement) {
    bestScoreElement.textContent = localStorage.getItem('bestScore') || '0';
  }

  gameOverScreen.style.display = 'flex';

  const laughSfx = document.getElementById('laugh-sfx') as HTMLAudioElement;
  if (laughSfx) {
    laughSfx.currentTime = 0;
    laughSfx.volume = 1;
    laughSfx.play();

    if (audioContext) {
      try {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        let source: MediaElementAudioSourceNode;
        if (audioSources.has(laughSfx.id)) {
          source = audioSources.get(laughSfx.id)!;
        } else {
          source = audioContext.createMediaElementSource(laughSfx);
          audioSources.set(laughSfx.id, source);
        }

        const gainNode = audioContext.createGain();
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(1, audioContext.currentTime);

        const gameOverDuration = 5.0;
        const fadeOutStartTime = audioContext.currentTime + (gameOverDuration - 0.3);
        const fadeOutEndTime = audioContext.currentTime + gameOverDuration;

        gainNode.gain.setValueAtTime(1, fadeOutStartTime);
        gainNode.gain.linearRampToValueAtTime(0, fadeOutEndTime);

        setTimeout(() => {
          gainNode.disconnect();
        }, gameOverDuration * 1000 + 100);
      } catch (error) {
        console.error("Erreur lors du contrôle du volume:", error);
      }
    }
  }

  setTimeout(() => {
    location.reload();
  }, 5000);
}

window.addEventListener('mousedown', (event) => {
  if (event.button === 0 && commandState.isAiming && controls.isLocked && !isGameOver && canShoot) {
    canShoot = false;
    const shotSfx = document.getElementById('shot-sfx') as HTMLAudioElement;
    if (shotSfx) {
      shotSfx.currentTime = 0;
      shotSfx.play();
      shotSfx.onended = () => {
        canShoot = true;
      };
    }

    event.preventDefault();
    mouse.x = 0; mouse.y = 0;
    raycaster.setFromCamera(mouse, camera);
    const targetGroups = getTargets().map(t => t.mesh);
    const intersects = raycaster.intersectObjects(targetGroups, true);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      let hitTarget: Target | null = null;

      if (hitObject.parent instanceof Group) {
        hitTarget = getTargets().find(t => t.mesh === hitObject.parent) ?? null;
      }

      if (hitTarget) {
        importedHandleTargetHit(
          hitTarget,
          scene,
          createExplosion,
          updateScore,
          gameOver,
          () => {
            if (!isGameOver) {
              resetTimer();
              importedCheckAndSpawnTarget(scene);
            }
          }
        );
      }
    }
  } else if (event.button === 0 && !controls.isLocked && isGameStarted && !isGameOver) {
    controls.lock();
  } else if (event.button === 0 && !isGameStarted) {
    isGameStarted = true;
    startScreen.style.display = 'none';
    document.body.classList.add('game-active');
    const sniperPovImage = document.getElementById('sniper-pov') as HTMLImageElement;
    const objectiveDisplay = document.getElementById('objective-display');
    if (sniperPovImage) sniperPovImage.style.display = 'block';
    if (objectiveDisplay) objectiveDisplay.style.display = 'block';
    instructions.style.display = 'block';

    timeRemaining = 30.0;
    timerDisplay.innerHTML = timeRemaining.toFixed(1);

    controls.lock();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const clock = new Clock()

function animate(_time: number) {
  stats.begin();

  const delta = clock.getDelta()

  if (isGameStarted && !isGameOver) {
    timeRemaining -= delta;

    if (timeRemaining <= 0) {
      timeRemaining = 0;
      gameOver('time');
    } else {
      timerDisplay.innerHTML = timeRemaining.toFixed(1);

      if (timeRemaining <= 5) {
        timerDisplay.classList.add('danger');
        timerDisplay.classList.remove('warning');
      } else if (timeRemaining <= 10) {
        timerDisplay.classList.add('warning');
        timerDisplay.classList.remove('danger');
      }
    }
  }

  if (commandState.isAiming) {
    document.body.classList.add('aiming');
  } else {
    document.body.classList.remove('aiming');
  }

  camera.fov += (commandState.targetFov - camera.fov) * fovLerpFactor;
  camera.updateProjectionMatrix();

  const moveSpeed = playerMoveSpeed * delta;

  if (controls.isLocked) {
    let moveForward = 0;
    let moveRight = 0;

    if (commandState.moveState.forward) moveForward += moveSpeed;
    if (commandState.moveState.backward) moveForward -= moveSpeed;
    if (commandState.moveState.right) moveRight += moveSpeed;
    if (commandState.moveState.left) moveRight -= moveSpeed;

    controls.moveForward(moveForward);
    controls.moveRight(moveRight);
  }

  const rooftopLimit = buildingSize / 2 - muretThickness - 0.1;
  camera.position.x = Math.max(-rooftopLimit, Math.min(rooftopLimit, camera.position.x));
  camera.position.z = Math.max(-rooftopLimit, Math.min(rooftopLimit, camera.position.z));
  camera.position.y = buildingHeight + playerHeight;

  updateTargets(delta);

  for (let i = explosionParticles.length - 1; i >= 0; i--) {
    const particle = explosionParticles[i];

    if (particle.life === undefined) continue;

    particle.life -= delta;

    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      explosionParticles.splice(i, 1);
    } else {
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      particle.velocity.y -= 9.8 * delta * 0.5;

      const initialLife = particle.initialLife ?? 1;
      (particle.mesh.material as MeshBasicMaterial).opacity = particle.life / initialLife;
    }
  }

  renderer.render(scene, camera)
  stats.end();
}

renderer.setAnimationLoop(animate);

const concreteMaterial = new MeshStandardMaterial({ map: concreteTexture() });
const buildingSideMaterial = new MeshStandardMaterial({ color: 0xaaaaaa });

const buildingMaterials = [
  buildingSideMaterial,
  buildingSideMaterial,
  concreteMaterial,
  buildingSideMaterial,
  buildingSideMaterial,
  buildingSideMaterial
];

const buildingGeometry = new BoxGeometry(buildingSize, buildingHeight, buildingSize);
const buildingMesh = new Mesh(buildingGeometry, buildingMaterials);
buildingMesh.position.y = buildingHeight / 2;
buildingMesh.castShadow = true;
buildingMesh.receiveShadow = true;
scene.add(buildingMesh);

const muretMaterial = new MeshStandardMaterial({ map: brickTexture() });
const wallZGeo = new BoxGeometry(buildingSize, muretHeight, muretThickness);
const wallFront = new Mesh(wallZGeo, muretMaterial);
wallFront.position.set(0, buildingHeight + muretHeight / 2, -buildingSize / 2 + muretThickness / 2);
wallFront.castShadow = true;
scene.add(wallFront);

const wallBack = new Mesh(wallZGeo, muretMaterial.clone());
wallBack.position.set(0, buildingHeight + muretHeight / 2, buildingSize / 2 - muretThickness / 2);
wallBack.castShadow = true;
scene.add(wallBack);

const wallXGeo = new BoxGeometry(muretThickness, muretHeight, buildingSize);
const wallLeft = new Mesh(wallXGeo, muretMaterial.clone());
wallLeft.position.set(-buildingSize / 2 + muretThickness / 2, buildingHeight + muretHeight / 2, 0);
wallLeft.castShadow = true;
scene.add(wallLeft);

const wallRight = new Mesh(wallXGeo, muretMaterial.clone());
wallRight.position.set(buildingSize / 2 - muretThickness / 2, buildingHeight + muretHeight / 2, 0);
wallRight.castShadow = true;
scene.add(wallRight);

const parkGeometry = new PlaneGeometry(parkSize, parkSize);
const parkMaterial = new MeshStandardMaterial({ map: grassTexture(), side: DoubleSide })
parkMaterial.metalness = 0.1
parkMaterial.roughness = 0.9
const parkPlane = new Mesh(parkGeometry, parkMaterial)
parkPlane.rotation.x = -Math.PI / 2
parkPlane.position.y = 0
parkPlane.receiveShadow = true
scene.add(parkPlane)

export const vegetation: Mesh[] = [];
const treeTrunkGeometry = new CylinderGeometry(0.4, 0.5, 3.0, 12);
const treeLeavesGeometry = new SphereGeometry(2.5, 16, 12);

const treeTrunkMaterial = new MeshStandardMaterial({
  map: willowTexture(),
  roughness: 0.9,
  metalness: 0.1
});
const treeLeavesMaterial = new MeshStandardMaterial({
  map: leafTexture(),
  roughness: 0.7,
  metalness: 0.0
});

const vegetationDensity = 0.007;
const vegetationArea = parkSize * parkSize;
const numVegetationItems = Math.floor(vegetationArea * vegetationDensity);
const vegetationPlacementMargin = 2;
const parkPlacementArea = parkSize - vegetationPlacementMargin * 2;

for (let i = 0; i < numVegetationItems; i++) {
  const isTree = Math.random() > 0.25;
  const x = (Math.random() - 0.5) * parkPlacementArea;
  const z = (Math.random() - 0.5) * parkPlacementArea;

  if (isTree) {
    const treeGroup = new Group();
    const trunk = new Mesh(treeTrunkGeometry, treeTrunkMaterial);
    trunk.position.y = 3.0 / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const leaves = new Mesh(treeLeavesGeometry, treeLeavesMaterial);
    leaves.position.y = 3.0 + 1.5;
    leaves.castShadow = true;
    treeGroup.add(leaves);

    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    vegetation.push(trunk);
  }
}

const fenceMaterial = new MeshStandardMaterial({
  map: fenceTexture(),
  side: DoubleSide,
  transparent: true,
  alphaTest: 0.1
});

const fenceGeometryLR = new PlaneGeometry(parkSize, fenceHeight);
const fenceGeometryFB = new PlaneGeometry(parkSize, fenceHeight);

const fenceFront = new Mesh(fenceGeometryFB, fenceMaterial);
fenceFront.position.set(0, fenceHeight / 2, parkSize / 2);
fenceFront.castShadow = true;
scene.add(fenceFront);

const fenceBack = new Mesh(fenceGeometryFB, fenceMaterial);
fenceBack.position.set(0, fenceHeight / 2, -parkSize / 2);
fenceBack.castShadow = true;
scene.add(fenceBack);

const fenceLeft = new Mesh(fenceGeometryLR, fenceMaterial);
fenceLeft.position.set(-parkSize / 2, fenceHeight / 2, 0);
fenceLeft.rotation.y = Math.PI / 2;
fenceLeft.castShadow = true;
scene.add(fenceLeft);

const fenceRight = new Mesh(fenceGeometryLR, fenceMaterial);
fenceRight.position.set(parkSize / 2, fenceHeight / 2, 0);
fenceRight.rotation.y = Math.PI / 2;
fenceRight.castShadow = true;
scene.add(fenceRight);

const ambientLight = new AmbientLight(0xffffff, 0.3);
scene.add(ambientLight)
const sunLight = new DirectionalLight(0xffffff, 2);
sunLight.position.set(-30, 50, -20);
sunLight.castShadow = true
sunLight.shadow.mapSize.width = 1024
sunLight.shadow.mapSize.height = 1024
sunLight.shadow.camera.near = 0.5
sunLight.shadow.camera.far = 500
sunLight.shadow.camera.left = -shadowCamSize
sunLight.shadow.camera.right = shadowCamSize
sunLight.shadow.camera.top = shadowCamSize
sunLight.shadow.camera.bottom = -shadowCamSize
scene.add(sunLight)
scene.add(sunLight.target)

function resetTimer() {
  currentTargetTimer = 15 + timeRemaining;
  timeRemaining = currentTargetTimer;
  timerDisplay.innerHTML = timeRemaining.toFixed(1);
  timerDisplay.classList.remove('warning', 'danger');
}
