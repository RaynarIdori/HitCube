import {
    Group, Vector3, BoxGeometry, MeshStandardMaterial, Mesh, Scene
} from 'three';
import { Target } from './interfaces';
import {
    targetIdentities, parkSpawnArea, minSpawnDist, targetSpeed, parkSize, numberOfTargets
} from './constants';

let targets: Target[] = [];
let activeTargetIds = new Set<number>();
let designatedTarget: Target | null = null;

const targetBaseGeometry = new BoxGeometry(1, 1, 1);
const hatGeometry = new BoxGeometry(0.8, 0.1, 0.8);
const vestPanelGeometry = new BoxGeometry(1.05, 0.7, 0.05);
const shoeGeometry = new BoxGeometry(1.1, 0.1, 1.1);

const hatMaterial = new MeshStandardMaterial({ color: 0x000000, name: 'hat' });
const vestMaterial = new MeshStandardMaterial({ color: 0x0000cc, name: 'vest' });
const shoeMaterial = new MeshStandardMaterial({ color: 0x00aa00, name: 'shoes' });

function spawnTarget(scene: Scene): Target | null {
    const availableIds = targetIdentities.filter(identity => !activeTargetIds.has(identity.id));
    if (availableIds.length === 0) {
        console.error("Aucune identité de cible unique disponible !");
        return null;
    }

    const selectedIdentity = availableIds[Math.floor(Math.random() * availableIds.length)];
    activeTargetIds.add(selectedIdentity.id);

    const targetGroup = new Group();
    targetGroup.castShadow = true;
    targetGroup.receiveShadow = false;

    const baseMaterial = new MeshStandardMaterial({ color: selectedIdentity.baseColorHex });
    baseMaterial.name = 'base_cube';
    const baseCube = new Mesh(targetBaseGeometry, baseMaterial);
    baseCube.receiveShadow = false;
    baseCube.userData = { isTargetBase: true };
    targetGroup.add(baseCube);

    if (selectedIdentity.hasHat) {
        const hat = new Mesh(hatGeometry, hatMaterial.clone());
        hat.position.y = 0.5 + 0.05;
        targetGroup.add(hat);
    }
    if (selectedIdentity.hasVest) {
        const vestFront = new Mesh(vestPanelGeometry, vestMaterial.clone());
        vestFront.position.z = 0.5 + 0.025;
        targetGroup.add(vestFront);
        const vestBack = new Mesh(vestPanelGeometry, vestMaterial.clone());
        vestBack.position.z = -0.5 - 0.025;
        targetGroup.add(vestBack);
        const vestLeft = new Mesh(vestPanelGeometry, vestMaterial.clone());
        vestLeft.rotation.y = Math.PI / 2;
        vestLeft.position.x = -0.5 - 0.025;
        targetGroup.add(vestLeft);
        const vestRight = new Mesh(vestPanelGeometry, vestMaterial.clone());
        vestRight.rotation.y = Math.PI / 2;
        vestRight.position.x = 0.5 + 0.025;
        targetGroup.add(vestRight);
    }
    if (selectedIdentity.hasShoes) {
        const shoes = new Mesh(shoeGeometry, shoeMaterial.clone());
        shoes.position.y = -0.5 - 0.05;
        targetGroup.add(shoes);
    }

    let x, z;
    do {
        x = (Math.random() - 0.5) * parkSpawnArea;
        z = (Math.random() - 0.5) * parkSpawnArea;
    } while (Math.sqrt(x * x + z * z) < minSpawnDist);
    targetGroup.position.set(x, 0.6, z);

    const velocity = new Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
    );
    velocity.normalize().multiplyScalar(targetSpeed);

    scene.add(targetGroup);

    const newTarget: Target = {
        mesh: targetGroup,
        velocity,
        identity: selectedIdentity,
        isDesignatedTarget: false
    };
    targets.push(newTarget);

    if (targets.length === 1) {
        setDesignatedTarget(newTarget);
    }
    return newTarget;
}

function updateObjectiveDisplay(target: Target | null): void {
    const objectiveDisplayElement = document.getElementById('objective-display');
    if (objectiveDisplayElement) {
        if (target) {
            objectiveDisplayElement.innerHTML = `
                <div class="objective-title">Objectif :</div>
                <div class="objective-name">${target.identity.name}</div>
                <div class="objective-desc">${target.identity.description}</div>
            `;
            console.log('Objectif de mission :', {
                name: target.identity.name,
                description: target.identity.description
            });
        } else {
            objectiveDisplayElement.innerHTML = `
                <div class="objective-title">Objectif :</div>
                <div class="objective-status">Aucune cible restante !</div>
             `;
        }
    }
}

export function initializeTargets(scene: Scene): void {
    targets = [];
    activeTargetIds.clear();
    designatedTarget = null;
    for (let i = 0; i < numberOfTargets; i++) {
        spawnTarget(scene);
    }
}

export function updateTargets(delta: number): void {
    const parkBoundary = parkSize / 2 - 1;
    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];

        target.mesh.position.addScaledVector(target.velocity, delta);

        if (Math.abs(target.mesh.position.x) > parkBoundary) {
            target.velocity.x *= -1;
            target.mesh.position.x = Math.sign(target.mesh.position.x) * parkBoundary;
        }
        if (Math.abs(target.mesh.position.z) > parkBoundary) {
            target.velocity.z *= -1;
            target.mesh.position.z = Math.sign(target.mesh.position.z) * parkBoundary;
        }
    }
}

export function getTargets(): Target[] {
    return targets;
}

function setDesignatedTarget(target: Target | null): void {
    if (designatedTarget) {
        designatedTarget.isDesignatedTarget = false;
    }
    designatedTarget = target;
    if (designatedTarget) {
        designatedTarget.isDesignatedTarget = true;
    }
    updateObjectiveDisplay(designatedTarget);
}

export function handleTargetHit(
    hitTarget: Target,
    scene: Scene,
    createExplosionCallback: (position: Vector3) => void,
    updateScoreCallback: (points: number) => void,
    gameOverCallback: () => void,
    onTargetRemoved: () => void
): boolean {
    const targetIndex = targets.indexOf(hitTarget);
    if (targetIndex === -1) {
        console.warn("handleTargetHit called on a target not found in the list.");
        return false;
    }

    const wasDesignated = hitTarget === designatedTarget;

    createExplosionCallback(hitTarget.mesh.position.clone());

    const deathSfx = document.getElementById('death-sfx') as HTMLAudioElement;
    if (deathSfx) {
        deathSfx.currentTime = 0;
        deathSfx.play();
    }

    activeTargetIds.delete(hitTarget.identity.id);
    scene.remove(hitTarget.mesh);
    targets.splice(targetIndex, 1);
    onTargetRemoved();

    if (wasDesignated) {
        console.log('%cSUCCÈS : Cible désignée éliminée !', 'color: green; font-weight: bold;');
        updateScoreCallback(100);

        if (targets.length > 0) {
            const newDesignated = targets[Math.floor(Math.random() * targets.length)];
            setDesignatedTarget(newDesignated);
        } else {
            setDesignatedTarget(null);
        }
        return false;

    } else {
        console.log('%cÉCHEC : Mauvaise cible éliminée !', 'color: red;');
        console.log(`Vous avez touché ID ${hitTarget.identity.id} (${hitTarget.identity.name}), mais la cible était ID ${designatedTarget?.identity.id} (${designatedTarget?.identity.name})`);
        gameOverCallback();
        return true;
    }
}

export function checkAndSpawnTarget(scene: Scene): void {
    if (targets.length < numberOfTargets) {
        const newTarget = spawnTarget(scene);
        if (newTarget && targets.length === 1 && designatedTarget === null) {
            setDesignatedTarget(newTarget);
        }
    }
}