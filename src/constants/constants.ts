import { TargetIdentity } from '../types/interfaces';
import targetIdentitiesData from '../data/target-identities.data.json';

export const buildingHeight = 13.5, buildingSize = 20, parkSize = 250;
export const playerHeight = 1.7, muretHeight = 0.5, muretThickness = 0.2;
export const numberOfTargets = 20, targetSpeed = 5;
export const parkSpawnArea = parkSize * 0.8, minSpawnDist = buildingSize * 1.8;
export const defaultFov = 75, zoomedFov = 25;
export const particleLife = 0.5, particleSpeed = 3, playerMoveSpeed = 5.0;
export const fovLerpFactor = 0.1, fenceHeight = 2;
export const shadowCamSize = parkSize * 0.6;

type TargetIdentityJson = Omit<TargetIdentity, 'baseColorHex'> & { baseColorHex: string };

export const targetIdentities: TargetIdentity[] = (targetIdentitiesData as TargetIdentityJson[])
    .map(item => ({ ...item, baseColorHex: parseInt(item.baseColorHex.substring(2), 16) }));