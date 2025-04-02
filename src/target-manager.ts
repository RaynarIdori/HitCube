import {
    Group, Vector3, BoxGeometry, MeshStandardMaterial, Mesh, Scene, CylinderGeometry
} from 'three';
import { Target } from './interfaces';
import {
    targetIdentities, parkSpawnArea, minSpawnDist, targetSpeed, parkSize, numberOfTargets
} from './constants';

let targets: Target[] = [];
let activeTargetIds = new Set<number>();
let designatedTarget: Target | null = null;

// Minecraft-style character geometries
const headGeometry = new BoxGeometry(0.8, 0.8, 0.8);
const bodyGeometry = new BoxGeometry(0.8, 1.2, 0.4);
const armGeometry = new BoxGeometry(0.4, 1.2, 0.4);
const legGeometry = new BoxGeometry(0.4, 0.6, 0.4);

// Accessories - improved designs
// Hat with brim and crown
const hatTopGeometry = new BoxGeometry(0.7, 0.3, 0.7);
const hatBrimGeometry = new BoxGeometry(1.1, 0.1, 1.1);

// Vest panels
const vestPanelFrontBackGeometry = new BoxGeometry(0.85, 1.3, 0.05);
const vestPanelSideGeometry = new BoxGeometry(0.05, 1.3, 0.45);

// Better defined shoes
const shoeGeometry = new BoxGeometry(0.5, 0.2, 0.7); // Longer in z-direction for better shoe appearance

// Pants
const pantLegGeometry = new BoxGeometry(0.45, 0.8, 0.45);

// Materials
const hatMaterial = new MeshStandardMaterial({ color: 0x000000, name: 'hat' });
const vestMaterial = new MeshStandardMaterial({ color: 0x0000cc, name: 'vest' });
const shoeMaterial = new MeshStandardMaterial({ color: 0x00aa00, name: 'shoes' });
const pantsMaterial = new MeshStandardMaterial({ color: 0x0033aa, name: 'pants' }); // Blue pants

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
    
    // Create Minecraft-style character parts
    // Head
    const head = new Mesh(headGeometry, baseMaterial.clone());
    head.position.y = 1.6;
    head.userData = { isTargetBase: true };
    targetGroup.add(head);
    
    // Body
    const body = new Mesh(bodyGeometry, baseMaterial.clone());
    body.position.y = 0.6;
    targetGroup.add(body);
    
    // Left arm
    const leftArm = new Mesh(armGeometry, baseMaterial.clone());
    leftArm.position.set(-0.6, 0.6, 0);
    targetGroup.add(leftArm);
    
    // Right arm
    const rightArm = new Mesh(armGeometry, baseMaterial.clone());
    rightArm.position.set(0.6, 0.6, 0);
    targetGroup.add(rightArm);
    
    // Left leg
    const leftLeg = new Mesh(legGeometry, baseMaterial.clone());
    leftLeg.position.set(-0.2, -0.3, 0);
    targetGroup.add(leftLeg);
    
    // Right leg
    const rightLeg = new Mesh(legGeometry, baseMaterial.clone());
    rightLeg.position.set(0.2, -0.3, 0);
    targetGroup.add(rightLeg);

    // Add accessories based on identity
    if (selectedIdentity.hasHat) {
        // Create better hat with top and brim
        const hatTop = new Mesh(hatTopGeometry, hatMaterial.clone());
        hatTop.position.y = 2.15;
        targetGroup.add(hatTop);
        
        const hatBrim = new Mesh(hatBrimGeometry, hatMaterial.clone());
        hatBrim.position.y = 2.0;
        targetGroup.add(hatBrim);
    }
    
    if (selectedIdentity.hasVest) {
        // Front vest panel
        const vestFront = new Mesh(vestPanelFrontBackGeometry, vestMaterial.clone());
        vestFront.position.set(0, 0.6, 0.225);
        targetGroup.add(vestFront);
        
        // Back vest panel
        const vestBack = new Mesh(vestPanelFrontBackGeometry, vestMaterial.clone());
        vestBack.position.set(0, 0.6, -0.225);
        targetGroup.add(vestBack);
        
        // Left vest panel
        const vestLeft = new Mesh(vestPanelSideGeometry, vestMaterial.clone());
        vestLeft.position.set(-0.425, 0.6, 0);
        targetGroup.add(vestLeft);
        
        // Right vest panel
        const vestRight = new Mesh(vestPanelSideGeometry, vestMaterial.clone());
        vestRight.position.set(0.425, 0.6, 0);
        targetGroup.add(vestRight);
    }
    
    // Add pants (only if the target is supposed to have pants)
    if (selectedIdentity.hasPants) {
        // Left pant leg
        const leftPant = new Mesh(pantLegGeometry, pantsMaterial.clone());
        leftPant.position.set(-0.2, -0.3, 0);
        targetGroup.add(leftPant);
        
        // Right pant leg
        const rightPant = new Mesh(pantLegGeometry, pantsMaterial.clone());
        rightPant.position.set(0.2, -0.3, 0);
        targetGroup.add(rightPant);
    }
    
    if (selectedIdentity.hasShoes) {
        // Left shoe - improved to look more like actual shoes
        const leftShoe = new Mesh(shoeGeometry, shoeMaterial.clone());
        leftShoe.position.set(-0.2, -0.7, 0.05); // Moved slightly forward
        targetGroup.add(leftShoe);
        
        // Right shoe
        const rightShoe = new Mesh(shoeGeometry, shoeMaterial.clone());
        rightShoe.position.set(0.2, -0.7, 0.05); // Moved slightly forward
        targetGroup.add(rightShoe);
    }

    let x, z;
    do {
        x = (Math.random() - 0.5) * parkSpawnArea;
        z = (Math.random() - 0.5) * parkSpawnArea;
    } while (Math.sqrt(x * x + z * z) < minSpawnDist);
    
    // Position the character slightly higher to account for new proportions
    targetGroup.position.set(x, 0.7, z);

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
        targetPosition: null,
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
    const arrivalThresholdSq = 0.5 * 0.5;

    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        const currentPosition = target.mesh.position;

        if (!target.targetPosition || currentPosition.distanceToSquared(target.targetPosition) < arrivalThresholdSq) {
            const newX = (Math.random() - 0.5) * parkSpawnArea;
            const newZ = (Math.random() - 0.5) * parkSpawnArea;
            target.targetPosition = new Vector3(newX, currentPosition.y, newZ);
        }

        const direction = target.targetPosition.clone().sub(currentPosition);
        direction.y = 0;

        if (direction.lengthSq() > 0.001) {
            direction.normalize();
            target.velocity.copy(direction).multiplyScalar(targetSpeed);
            target.mesh.lookAt(currentPosition.clone().add(direction));
        } else {
            target.velocity.set(0, 0, 0);
        }

        target.mesh.position.addScaledVector(target.velocity, delta);

        target.mesh.position.x = Math.max(-parkBoundary, Math.min(parkBoundary, target.mesh.position.x));

        target.mesh.position.z = Math.max(-parkBoundary, Math.min(parkBoundary, target.mesh.position.z));

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