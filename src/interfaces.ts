import { Group, Mesh, Vector3 } from 'three';

export interface TargetIdentity {
    id: number;
    name: string;
    description: string;
    baseColorHex: number;
    hasHat: boolean;
    hasVest: boolean;
    hasShoes: boolean;
}

export interface Target {
    mesh: Group;
    velocity: Vector3;
    targetPosition: Vector3 | null;
    identity: TargetIdentity;
    isDesignatedTarget: boolean;
}

export interface ExplosionParticle {
    mesh: Mesh;
    velocity: Vector3;
    life: number;
    initialLife: number;
} 