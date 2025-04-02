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
// Keep the kill counter for speed calculations but remove the display element
let targetsKilled = 0;
let currentTargetSpeed = targetSpeed;

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
const shoeGeometry = new BoxGeometry(0.45, 0.25, 0.8); // Augmenté la longueur pour qu'elles dépassent plus vers l'avant

// Pants
const pantLegGeometry = new BoxGeometry(0.45, 0.8, 0.45);

// Materials
const hatMaterial = new MeshStandardMaterial({ color: 0x000000, name: 'hat' });
const vestMaterial = new MeshStandardMaterial({ color: 0x0000cc, name: 'vest' });
const shoeMaterial = new MeshStandardMaterial({ color: 0x00aa00, name: 'shoes' });
const pantsMaterial = new MeshStandardMaterial({ color: 0x0033aa, name: 'pants' }); // Blue pants
const eyeMaterial = new MeshBasicMaterial({ color: 0x000000 }); // Black for eyes
const mouthMaterial = new MeshBasicMaterial({ color: 0x000000 }); // Black for mouth

// Géométries pour les visages
const eyeGeometry = new BoxGeometry(0.1, 0.1, 0.05);
const wideEyeGeometry = new BoxGeometry(0.15, 0.1, 0.05);
const mouthGeometry = new BoxGeometry(0.3, 0.08, 0.05);
const smileMouthGeometry = new BoxGeometry(0.3, 0.05, 0.05);

// Fonction pour ajouter un visage aléatoire
function addRandomFace(head: Mesh): void {
    const faceType = Math.floor(Math.random() * 4); // 4 types de visages
    
    // Positionnement sur la face avant (z positif)
    const faceZ = 0.4;
    
    switch(faceType) {
        case 0: // Visage standard
            // Yeux
            const leftEye = new Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.2, 0.1, faceZ);
            head.add(leftEye);
            
            const rightEye = new Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.2, 0.1, faceZ);
            head.add(rightEye);
            
            // Bouche
            const mouth = new Mesh(mouthGeometry, mouthMaterial);
            mouth.position.set(0, -0.2, faceZ);
            head.add(mouth);
            break;
            
        case 1: // Visage souriant
            // Yeux
            const leftEye1 = new Mesh(eyeGeometry, eyeMaterial);
            leftEye1.position.set(-0.2, 0.1, faceZ);
            head.add(leftEye1);
            
            const rightEye1 = new Mesh(eyeGeometry, eyeMaterial);
            rightEye1.position.set(0.2, 0.1, faceZ);
            head.add(rightEye1);
            
            // Bouche souriante (deux parties)
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
            
        case 2: // Visage surpris
            // Yeux ronds
            const leftEye2 = new Mesh(wideEyeGeometry, eyeMaterial);
            leftEye2.position.set(-0.2, 0.1, faceZ);
            head.add(leftEye2);
            
            const rightEye2 = new Mesh(wideEyeGeometry, eyeMaterial);
            rightEye2.position.set(0.2, 0.1, faceZ);
            head.add(rightEye2);
            
            // Bouche ronde
            const surpriseMouth = new Mesh(eyeGeometry, mouthMaterial);
            surpriseMouth.scale.set(1.5, 1.5, 1);
            surpriseMouth.position.set(0, -0.2, faceZ);
            head.add(surpriseMouth);
            break;
            
        case 3: // Visage grognon
            // Yeux
            const leftEye3 = new Mesh(eyeGeometry, eyeMaterial);
            leftEye3.position.set(-0.2, 0.1, faceZ);
            head.add(leftEye3);
            
            const rightEye3 = new Mesh(eyeGeometry, eyeMaterial);
            rightEye3.position.set(0.2, 0.1, faceZ);
            head.add(rightEye3);
            
            // Bouche inversée
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
    
    // Create Minecraft-style character parts
    // Head
    const head = new Mesh(headGeometry, baseMaterial.clone());
    head.position.y = 1.6;
    head.userData = { isTargetBase: true };
    
    // Ajouter un visage aléatoire
    addRandomFace(head);
    
    targetGroup.add(head);
    
    // Body
    const body = new Mesh(bodyGeometry, baseMaterial.clone());
    body.position.y = 0.6;
    targetGroup.add(body);
    
    // Left arm - mettre dans un groupe pour l'animation
    const leftArmGroup = new Group();
    leftArmGroup.position.set(-0.6, 1.2, 0);
    const leftArm = new Mesh(armGeometry, baseMaterial.clone());
    leftArm.position.y = -0.6; // Centrer sur le groupe pour la rotation
    leftArmGroup.add(leftArm);
    targetGroup.add(leftArmGroup);
    
    // Right arm - mettre dans un groupe pour l'animation
    const rightArmGroup = new Group();
    rightArmGroup.position.set(0.6, 1.2, 0);
    const rightArm = new Mesh(armGeometry, baseMaterial.clone());
    rightArm.position.y = -0.6; // Centrer sur le groupe pour la rotation
    rightArmGroup.add(rightArm);
    targetGroup.add(rightArmGroup);
    
    // Left leg - mettre dans un groupe pour l'animation
    const leftLegGroup = new Group();
    leftLegGroup.position.set(-0.2, 0, 0);
    const leftLeg = new Mesh(legGeometry, baseMaterial.clone());
    leftLeg.position.y = -0.3; // Centrer sur le groupe pour la rotation
    leftLegGroup.add(leftLeg);
    targetGroup.add(leftLegGroup);
    
    // Right leg - mettre dans un groupe pour l'animation
    const rightLegGroup = new Group();
    rightLegGroup.position.set(0.2, 0, 0);
    const rightLeg = new Mesh(legGeometry, baseMaterial.clone());
    rightLeg.position.y = -0.3; // Centrer sur le groupe pour la rotation
    rightLegGroup.add(rightLeg);
    targetGroup.add(rightLegGroup);

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
        // Left pant leg - ajuster la position pour suivre le leftLegGroup
        const leftPant = new Mesh(pantLegGeometry, pantsMaterial.clone());
        leftPant.position.copy(leftLeg.position);
        leftLegGroup.add(leftPant);
        
        // Right pant leg - ajuster la position pour suivre le rightLegGroup
        const rightPant = new Mesh(pantLegGeometry, pantsMaterial.clone());
        rightPant.position.copy(rightLeg.position);
        rightLegGroup.add(rightPant);
    }
    
    if (selectedIdentity.hasShoes) {
        // Left shoe - improved to look more like actual shoes
        const leftShoe = new Mesh(shoeGeometry, shoeMaterial.clone());
        leftShoe.position.set(0, -0.6, 0.25); // Augmenté le décalage vers l'avant
        leftLegGroup.add(leftShoe);
        
        // Right shoe
        const rightShoe = new Mesh(shoeGeometry, shoeMaterial.clone());
        rightShoe.position.set(0, -0.6, 0.25); // Augmenté le décalage vers l'avant
        rightLegGroup.add(rightShoe);
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

    // Sauvegarder les références aux membres pour l'animation
    const limbs: TargetLimbs = {
        leftArm: leftArmGroup,
        rightArm: rightArmGroup,
        leftLeg: leftLegGroup,
        rightLeg: rightLegGroup,
        animationPhase: Math.random() * Math.PI * 2 // Phase aléatoire pour éviter que tous les personnages marchent en synchronisation
    };

    const newTarget: Target = {
        mesh: targetGroup,
        velocity,
        targetPosition: null,
        identity: selectedIdentity,
        isDesignatedTarget: false,
        limbs // Ajouter les membres à la cible
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
            // List all characteristics including pants status
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
            // Use currentTargetSpeed instead of targetSpeed
            target.velocity.copy(direction).multiplyScalar(currentTargetSpeed);
            target.mesh.lookAt(currentPosition.clone().add(direction));
            
            // Animation de marche
            if (target.limbs) {
                const speed = target.velocity.length();
                const walkSpeedFactor = speed / currentTargetSpeed; // Facteur de vitesse normalisé
                
                // Mettre à jour la phase d'animation
                target.limbs.animationPhase += delta * 10 * walkSpeedFactor;
                
                // Appliquer les rotations des membres
                const swingAmplitude = Math.PI / 8; // ~22.5 degrés
                const swingFactor = Math.sin(target.limbs.animationPhase) * swingAmplitude;
                
                // Bras et jambes opposés pour un mouvement naturel
                target.limbs.leftArm.rotation.x = -swingFactor;
                target.limbs.rightArm.rotation.x = swingFactor;
                target.limbs.leftLeg.rotation.x = swingFactor;
                target.limbs.rightLeg.rotation.x = -swingFactor;
            }
        } else {
            target.velocity.set(0, 0, 0);
            
            // Réinitialiser les rotations en position immobile
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
    
    // Update kill counter and increase target speed
    if (wasDesignated) {
        targetsKilled++;
        
        // Increase target movement speed
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