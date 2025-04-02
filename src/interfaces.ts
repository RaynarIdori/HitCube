import { Group, Mesh, Vector3, Scene as ThreeScene } from 'three';

export interface TargetIdentity {
    id: number;
    name: string;
    description: string;
    baseColorHex: number;
    hasHat: boolean;
    hasVest: boolean;
    hasShoes: boolean;
    hasPants: boolean;
}

export interface TargetLimbs {
    leftArm: Group;
    rightArm: Group;
    leftLeg: Group;
    rightLeg: Group;
    animationPhase: number;
}

export interface Target {
    mesh: Group;
    velocity: Vector3;
    targetPosition: Vector3 | null;
    identity: TargetIdentity;
    isDesignatedTarget: boolean;
    limbs?: TargetLimbs;
}

export interface ExplosionParticle {
    mesh: Mesh;
    velocity: Vector3;
    timeCreated: number;
    life?: number;
    initialLife?: number;
}

export type Scene = ThreeScene;