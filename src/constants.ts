import { TargetIdentity } from './interfaces';
import targetIdentitiesData from './data/target-identities.data.json';

export const buildingHeight = 13.5;
export const buildingSize = 20;
export const parkSize = 250;
export const playerHeight = 1.7;
export const muretHeight = 0.5;
export const muretThickness = 0.2;
export const numberOfTargets = 20;
export const targetSpeed = 5;
export const parkSpawnArea = parkSize * 0.8;
export const minSpawnDist = buildingSize * 1.8;
export const defaultFov = 75;
export const zoomedFov = 25;
export const particleLife = 0.5;
export const particleSpeed = 3;
export const playerMoveSpeed = 5.0;
export const fovLerpFactor = 0.1;
export const fenceHeight = 2;
export const shadowCamSize = parkSize * 0.6;

type TargetIdentityJson = Omit<TargetIdentity, 'baseColorHex'> & { baseColorHex: string };

export const targetIdentities: TargetIdentity[] = (targetIdentitiesData as TargetIdentityJson[]).map(item => ({
    ...item,
    baseColorHex: parseInt(item.baseColorHex.substring(2), 16)
})); 