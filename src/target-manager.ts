import {
    Group, Vector3, BoxGeometry, MeshStandardMaterial, Mesh, Scene, MeshBasicMaterial
} from 'three';
import { Target, TargetLimbs } from './interfaces';
import {
    targetIdentities, parkSpawnArea, minSpawnDist, targetSpeed, parkSize, numberOfTargets
} from './constants';

let targets: Target[] = [];
let activeTargetIds = new Set<number>();
let designatedTarget: Target | null = null;
let targetsKilled = 0;
let currentTargetSpeed = targetSpeed;

const headGeometry = new BoxGeometry(0.8, 0.8, 0.8);
const bodyGeometry = new BoxGeometry(0.8, 1.2, 0.4);
const armGeometry = new BoxGeometry(0.4, 1.2, 0.4);
const legGeometry = new BoxGeometry(0.4, 0.6, 0.4);
const hatTopGeometry = new BoxGeometry(0.7, 0.3, 0.7);
const hatBrimGeometry = new BoxGeometry(1.1, 0.1, 1.1);
const vestPanelFrontBackGeometry = new BoxGeometry(0.85, 1.3, 0.05);
const vestPanelSideGeometry = new BoxGeometry(0.05, 1.3, 0.45);
const shoeGeometry = new BoxGeometry(0.45, 0.25, 0.8);
const pantLegGeometry = new BoxGeometry(0.45, 0.8, 0.45);
const eyeGeometry = new BoxGeometry(0.1, 0.1, 0.05);
const wideEyeGeometry = new BoxGeometry(0.15, 0.1, 0.05);
const mouthGeometry = new BoxGeometry(0.3, 0.08, 0.05);
const smileMouthGeometry = new BoxGeometry(0.3, 0.05, 0.05);

const hatMaterial = new MeshStandardMaterial({ color: 0x000000, name: 'hat' });
const vestMaterial = new MeshStandardMaterial({ color: 0x0000cc, name: 'vest' });
const shoeMaterial = new MeshStandardMaterial({ color: 0x00aa00, name: 'shoes' });
const pantsMaterial = new MeshStandardMaterial({ color: 0x0033aa, name: 'pants' });
const eyeMaterial = new MeshBasicMaterial({ color: 0x000000 });
const mouthMaterial = new MeshBasicMaterial({ color: 0x000000 });

function addRandomFace(head: Mesh): void {
    const faceType = Math.floor(Math.random() * 4);
    const faceZ = 0.4;

    switch (faceType) {
        case 0:
            const leftEye = new Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.2, 0.1, faceZ);
            head.add(leftEye);

            const rightEye = new Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.2, 0.1, faceZ);
            head.add(rightEye);

            const mouth = new Mesh(mouthGeometry, mouthMaterial);
            mouth.position.set(0, -0.2, faceZ);
            head.add(mouth);
            break;

        case 1:
            const leftEye1 = new Mesh(eyeGeometry, eyeMaterial);
            leftEye1.position.set(-0.2, 0.1, faceZ);
            head.add(leftEye1);

            const rightEye1 = new Mesh(eyeGeometry, eyeMaterial);
            rightEye1.position.set(0.2, 0.1, faceZ);
            head.add(rightEye1);

            const smileMouth = new Mesh(smileMouthGeometry, mouthMaterial);
            smileMouth.position.set(0, -0.2, faceZ);
            head.add(smileMouth);

            const smileLeft = new Mesh(eyeGeometry, mouthMaterial);
            smileLeft.position.set(-0.2, -0.15, faceZ);
            head.add(smileLeft);

            const smileRight = new Mesh(eyeGeometry, mouthMaterial);
            smileRight.position.set(0.2, -0.15, faceZ);
            head.add(smileRight);
            break;

        case 2:
            const leftEye2 = new Mesh(wideEyeGeometry, eyeMaterial);
            leftEye2.position.set(-0.2, 0.1, faceZ);
            head.add(leftEye2);

            const rightEye2 = new Mesh(wideEyeGeometry, eyeMaterial);
            rightEye2.position.set(0.2, 0.1, faceZ);
            head.add(rightEye2);

            const surpriseMouth = new Mesh(eyeGeometry, mouthMaterial);
            surpriseMouth.scale.set(1.5, 1.5, 1);
            surpriseMouth.position.set(0, -0.2, faceZ);
            head.add(surpriseMouth);
            break;

        case 3:
            const leftEye3 = new Mesh(eyeGeometry, eyeMaterial);
            leftEye3.position.set(-0.2, 0.1, faceZ);
            head.add(leftEye3);

            const rightEye3 = new Mesh(eyeGeometry, eyeMaterial);
            rightEye3.position.set(0.2, 0.1, faceZ);
            head.add(rightEye3);

            const frownMouth = new Mesh(smileMouthGeometry, mouthMaterial);
            frownMouth.position.set(0, -0.25, faceZ);
            head.add(frownMouth);

            const frownLeft = new Mesh(eyeGeometry, mouthMaterial);
            frownLeft.position.set(-0.2, -0.3, faceZ);
            head.add(frownLeft);

            const frownRight = new Mesh(eyeGeometry, mouthMaterial);
            frownRight.position.set(0.2, -0.3, faceZ);
            head.add(frownRight);
            break;
    }
}

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

    const head = new Mesh(headGeometry, baseMaterial.clone());
    head.position.y = 1.6;
    head.userData = { isTargetBase: true };
    addRandomFace(head);
    targetGroup.add(head);

    const body = new Mesh(bodyGeometry, baseMaterial.clone());
    body.position.y = 0.6;
    targetGroup.add(body);

    const leftArmGroup = new Group();
    leftArmGroup.position.set(-0.6, 1.2, 0);
    const leftArm = new Mesh(armGeometry, baseMaterial.clone());
    leftArm.position.y = -0.6;
    leftArmGroup.add(leftArm);
    targetGroup.add(leftArmGroup);

    const rightArmGroup = new Group();
    rightArmGroup.position.set(0.6, 1.2, 0);
    const rightArm = new Mesh(armGeometry, baseMaterial.clone());
    rightArm.position.y = -0.6;
    rightArmGroup.add(rightArm);
    targetGroup.add(rightArmGroup);

    const leftLegGroup = new Group();
    leftLegGroup.position.set(-0.2, 0, 0);
    const leftLeg = new Mesh(legGeometry, baseMaterial.clone());
    leftLeg.position.y = -0.3;
    leftLegGroup.add(leftLeg);
    targetGroup.add(leftLegGroup);

    const rightLegGroup = new Group();
    rightLegGroup.position.set(0.2, 0, 0);
    const rightLeg = new Mesh(legGeometry, baseMaterial.clone());
    rightLeg.position.y = -0.3;
    rightLegGroup.add(rightLeg);
    targetGroup.add(rightLegGroup);

    if (selectedIdentity.hasHat) {
        const hatTop = new Mesh(hatTopGeometry, hatMaterial.clone());
        hatTop.position.y = 2.15;
        targetGroup.add(hatTop);

        const hatBrim = new Mesh(hatBrimGeometry, hatMaterial.clone());
        hatBrim.position.y = 2.0;
        targetGroup.add(hatBrim);
    }

    if (selectedIdentity.hasVest) {
        const vestFront = new Mesh(vestPanelFrontBackGeometry, vestMaterial.clone());
        vestFront.position.set(0, 0.6, 0.225);
        targetGroup.add(vestFront);

        const vestBack = new Mesh(vestPanelFrontBackGeometry, vestMaterial.clone());
        vestBack.position.set(0, 0.6, -0.225);
        targetGroup.add(vestBack);

        const vestLeft = new Mesh(vestPanelSideGeometry, vestMaterial.clone());
        vestLeft.position.set(-0.425, 0.6, 0);
        targetGroup.add(vestLeft);

        const vestRight = new Mesh(vestPanelSideGeometry, vestMaterial.clone());
        vestRight.position.set(0.425, 0.6, 0);
        targetGroup.add(vestRight);
    }

    if (selectedIdentity.hasPants) {
        const leftPant = new Mesh(pantLegGeometry, pantsMaterial.clone());
        leftPant.position.copy(leftLeg.position);
        leftLegGroup.add(leftPant);

        const rightPant = new Mesh(pantLegGeometry, pantsMaterial.clone());
        rightPant.position.copy(rightLeg.position);
        rightLegGroup.add(rightPant);
    }

    if (selectedIdentity.hasShoes) {
        const leftShoe = new Mesh(shoeGeometry, shoeMaterial.clone());
        leftShoe.position.set(0, -0.6, 0.25);
        leftLegGroup.add(leftShoe);

        const rightShoe = new Mesh(shoeGeometry, shoeMaterial.clone());
        rightShoe.position.set(0, -0.6, 0.25);
        rightLegGroup.add(rightShoe);
    }

    let x, z;
    do {
        x = (Math.random() - 0.5) * parkSpawnArea;
        z = (Math.random() - 0.5) * parkSpawnArea;
    } while (Math.sqrt(x * x + z * z) < minSpawnDist);

    targetGroup.position.set(x, 0.7, z);

    const velocity = new Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
    );
    velocity.normalize().multiplyScalar(targetSpeed);

    scene.add(targetGroup);

    const limbs: TargetLimbs = {
        leftArm: leftArmGroup,
        rightArm: rightArmGroup,
        leftLeg: leftLegGroup,
        rightLeg: rightLegGroup,
        animationPhase: Math.random() * Math.PI * 2
    };

    const newTarget: Target = {
        mesh: targetGroup,
        velocity,
        targetPosition: null,
        identity: selectedIdentity,
        isDesignatedTarget: false,
        limbs
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
            const characteristics = [];
            if (target.identity.hasHat) characteristics.push("chapeau");
            if (target.identity.hasVest) characteristics.push("gilet");
            if (target.identity.hasShoes) characteristics.push("chaussures");
            if (target.identity.hasPants) characteristics.push("pantalon");

            const accessoriesText = characteristics.length > 0
                ? `avec ${characteristics.join(', ')}`
                : "sans accessoires";

            objectiveDisplayElement.innerHTML = `
                <div class="objective-title">Objectif :</div>
                <div class="objective-name">${target.identity.name}</div>
                <div class="objective-desc">${target.identity.description}</div>
                <div class="objective-accessories">Cible ${accessoriesText}</div>
            `;
            console.log('Objectif de mission :', {
                name: target.identity.name,
                description: target.identity.description,
                accessories: accessoriesText
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
            target.velocity.copy(direction).multiplyScalar(currentTargetSpeed);
            target.mesh.lookAt(currentPosition.clone().add(direction));

            if (target.limbs) {
                const speed = target.velocity.length();
                const walkSpeedFactor = speed / currentTargetSpeed;
                target.limbs.animationPhase += delta * 10 * walkSpeedFactor;

                const swingAmplitude = Math.PI / 8;
                const swingFactor = Math.sin(target.limbs.animationPhase) * swingAmplitude;

                target.limbs.leftArm.rotation.x = -swingFactor;
                target.limbs.rightArm.rotation.x = swingFactor;
                target.limbs.leftLeg.rotation.x = swingFactor;
                target.limbs.rightLeg.rotation.x = -swingFactor;
            }
        } else {
            target.velocity.set(0, 0, 0);

            if (target.limbs) {
                target.limbs.leftArm.rotation.x = 0;
                target.limbs.rightArm.rotation.x = 0;
                target.limbs.leftLeg.rotation.x = 0;
                target.limbs.rightLeg.rotation.x = 0;
            }
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
    gameOverCallback: (reason?: string) => void,
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

    if (wasDesignated) {
        targetsKilled++;
        currentTargetSpeed += 0.5;
        console.log(`Target speed increased to: ${currentTargetSpeed}`);
    }

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
        gameOverCallback('target');
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