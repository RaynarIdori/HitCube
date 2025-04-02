import './style.css'
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
import { ExplosionParticle, Target } from './interfaces';
import {
  buildingHeight, buildingSize, parkSize, playerHeight, muretHeight, muretThickness,
  defaultFov, particleLife, particleSpeed,
  playerMoveSpeed, fovLerpFactor, fenceHeight, shadowCamSize
} from './constants';
import { initializeTextures, brickTexture, concreteTexture, grassTexture, fenceTexture, willowTexture, leafTexture, bushTexture } from './texture-manager';
import { initializeCommandHandling, CommandState } from './commands';
import { initializeTargets, updateTargets, getTargets, handleTargetHit as importedHandleTargetHit, checkAndSpawnTarget as importedCheckAndSpawnTarget } from './target-manager';
import Stats from 'stats.js';

const scene = new Scene()

// Ajouter des styles pour empêcher la sélection de texte
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
  </div>
`;
document.body.appendChild(startScreen);

let score = 0;
let isGameOver = false;
let isGameStarted = false;
let canShoot = true;
let timeRemaining = 30.0;
let currentTargetTimer = 30.0;
let gameOverReason = '';

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
  console.log('Skybox HDR chargée.');
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
  console.log('Pointer LOCKED');
  document.body.classList.add('pointer-locked');
});

controls.addEventListener('unlock', () => {
  console.log('Pointer UNLOCKED');
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

// Ajouter cette variable pour l'audio context et l'interface pour WebKit
interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let audioContext: AudioContext | null = null;
let audioSources = new Map<string, MediaElementAudioSourceNode>();

function playAudioWithFade(audioElement: HTMLAudioElement, fadeInDuration: number, fadeOutStart: number, duration: number) {
  try {
    // Créer ou réutiliser l'AudioContext
    if (!audioContext) {
      const windowWithWebkit = window as WindowWithWebkitAudio;
      const AudioContextClass = window.AudioContext || windowWithWebkit.webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      } else {
        console.warn("AudioContext non supporté par le navigateur.");
        audioElement.currentTime = 0;
        audioElement.play();
        return;
      }
    }
    
    // Réveiller l'AudioContext si nécessaire
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Créer ou réutiliser la source
    let source: MediaElementAudioSourceNode;
    if (audioSources.has(audioElement.id)) {
      source = audioSources.get(audioElement.id)!;
    } else {
      source = audioContext.createMediaElementSource(audioElement);
      audioSources.set(audioElement.id, source);
    }
    
    // Créer un GainNode pour le contrôle du volume
    const gainNode = audioContext.createGain();
    
    // Connecter les nœuds
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Réinitialiser le son
    audioElement.currentTime = 0;
    
    // Démarrer avec volume à 0
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Jouer le son
    audioElement.play();
    
    // Fade in
    gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + fadeInDuration);
    
    // Fade out
    const fadeOutStartTime = audioContext.currentTime + fadeOutStart;
    const fadeOutEndTime = audioContext.currentTime + duration;
    gainNode.gain.setValueAtTime(1, fadeOutStartTime);
    gainNode.gain.linearRampToValueAtTime(0, fadeOutEndTime);
    
    // Déconnecter le gainNode après la fin
    setTimeout(() => {
      gainNode.disconnect();
    }, (duration + 0.5) * 1000);
  } catch (error) {
    console.error("Erreur lors de la lecture avec fondu:", error);
    // Fallback en cas d'erreur
    audioElement.currentTime = 0;
    audioElement.play();
  }
}

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
  console.log('Game Over - Controls unlocked. pointerLockElement:', document.pointerLockElement);
  
  gameOverReason = reason;
  const gameOverReasonElement = document.getElementById('game-over-reason');
  if (gameOverReasonElement) {
    if (reason === 'time') {
      gameOverReasonElement.textContent = "Vous n'avez pas réussi la mission !";
    } else {
      gameOverReasonElement.textContent = "Vous avez eliminé la mauvaise cible !";
    }
  }

  // Préparer l'écran de game over
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

  // Précharger le son AVANT d'afficher l'écran
  const laughSfx = document.getElementById('laugh-sfx') as HTMLAudioElement;
  if (laughSfx) {
    // Forcer le chargement
    laughSfx.load();
    laughSfx.currentTime = 0;
    laughSfx.volume = 1;
    
    // S'assurer que le son est prêt
    laughSfx.oncanplaythrough = () => {
      // Afficher l'écran et jouer le son SIMULTANÉMENT
      gameOverScreen.style.display = 'flex';
      laughSfx.play();
      
      // Appliquer le fade-out uniquement à la fin
      if (audioContext) {
        try {
          // Réveiller l'AudioContext si nécessaire
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
          
          // Créer ou réutiliser la source
          let source: MediaElementAudioSourceNode;
          if (audioSources.has(laughSfx.id)) {
            source = audioSources.get(laughSfx.id)!;
          } else {
            source = audioContext.createMediaElementSource(laughSfx);
            audioSources.set(laughSfx.id, source);
          }
          
          // Créer un GainNode pour le contrôle du volume
          const gainNode = audioContext.createGain();
          
          // Connecter les nœuds
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Aucun fade-in, commencer directement à volume normal
          gainNode.gain.setValueAtTime(1, audioContext.currentTime);
          
          // Fade-out uniquement sur les 0.3 dernières secondes
          const gameOverDuration = 5.0; // 5 secondes d'affichage
          const fadeOutStartTime = audioContext.currentTime + (gameOverDuration - 0.3);
          const fadeOutEndTime = audioContext.currentTime + gameOverDuration;
          
          gainNode.gain.setValueAtTime(1, fadeOutStartTime);
          gainNode.gain.linearRampToValueAtTime(0, fadeOutEndTime);
          
          // Déconnecter le gainNode après la fin
          setTimeout(() => {
            gainNode.disconnect();
          }, gameOverDuration * 1000 + 100);
        } catch (error) {
          console.error("Erreur lors du contrôle du volume:", error);
        }
      }
      
      // Programmer le redémarrage
      console.log('Game Over: Reloading in 5 seconds...');
      setTimeout(() => {
        location.reload();
      }, 5000);
    };
    
    // En cas d'erreur de chargement, on continue quand même
    laughSfx.onerror = () => {
      console.warn("Erreur de chargement du son de rire");
      gameOverScreen.style.display = 'flex';
      console.log('Game Over: Reloading in 5 seconds...');
      setTimeout(() => {
        location.reload();
      }, 5000);
    };
  } else {
    // Si pas de son, afficher quand même l'écran
    gameOverScreen.style.display = 'flex';
    console.log('Game Over: Reloading in 5 seconds...');
    setTimeout(() => {
      location.reload();
    }, 5000);
  }
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

    console.log('FIRE Mousedown - Aiming:', commandState.isAiming, 'Locked:', controls.isLocked);
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
      } else {
        console.log("Intersection detected, but failed to associate with a known target group.", hitObject);
      }
    }
  } else if (event.button === 0 && !controls.isLocked && isGameStarted && !isGameOver) {
    console.log('CLICK Mousedown - Game Active, Not Locked -> Attempt Lock');
    controls.lock();
  } else if (event.button === 0 && !isGameStarted) {
    console.log('CLICK Mousedown - Starting Game');
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
  } else if (isGameOver) {
    console.log('CLICK Mousedown - Game is OVER, ignoring lock attempt.');
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
      // Update timer display
      timerDisplay.innerHTML = timeRemaining.toFixed(1);
      
      // Visual warning when time is running low
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
    particle.life -= delta;

    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      explosionParticles.splice(i, 1);
    } else {
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      particle.velocity.y -= 9.8 * delta * 0.5;
      (particle.mesh.material as MeshBasicMaterial).opacity = particle.life / particle.initialLife;
    }
  }

  renderer.render(scene, camera)
  stats.end();
}

renderer.setAnimationLoop(animate);

const concreteMaterial = new MeshStandardMaterial({ map: concreteTexture });
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
const muretMaterial = new MeshStandardMaterial({ map: brickTexture });
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
const parkMaterial = new MeshStandardMaterial({ map: grassTexture, side: DoubleSide })
parkMaterial.metalness = 0.1
parkMaterial.roughness = 0.9
const parkPlane = new Mesh(parkGeometry, parkMaterial)
parkPlane.rotation.x = -Math.PI / 2
parkPlane.position.y = 0
parkPlane.receiveShadow = true
scene.add(parkPlane)

export const vegetation: Mesh[] = [];
const bushGeometry = new SphereGeometry(1.0, 16, 12);
const treeTrunkGeometry = new CylinderGeometry(0.4, 0.5, 3.0, 12);
const treeLeavesGeometry = new SphereGeometry(2.5, 16, 12);

const bushMaterial = new MeshStandardMaterial({ 
  map: bushTexture,
  roughness: 0.8,
  metalness: 0.2
});
const treeTrunkMaterial = new MeshStandardMaterial({ 
  map: willowTexture,
  roughness: 0.9,
  metalness: 0.1
});
const treeLeavesMaterial = new MeshStandardMaterial({ 
  map: leafTexture,
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

  } else {
    const bush = new Mesh(bushGeometry, bushMaterial);
    bush.position.set(x, 1.0, z);
    bush.castShadow = true;
    scene.add(bush);
    vegetation.push(bush);
  }
}

const fenceMaterial = new MeshStandardMaterial({
  map: fenceTexture,
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

// Add CSS styles for the timer
document.head.insertAdjacentHTML('beforeend', `
  <style>
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
    
    #timer-display.warning {
      color: #ff9900;
    }
    
    #timer-display.danger {
      color: #ff0000;
    }
  </style>
`);

function resetTimer() {
  currentTargetTimer = 30.0 + timeRemaining;
  timeRemaining = currentTargetTimer;
  timerDisplay.innerHTML = timeRemaining.toFixed(1);
  timerDisplay.classList.remove('warning', 'danger');
}
