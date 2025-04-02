import { TextureLoader, RepeatWrapping, Texture } from 'three';

interface TextureConfig {
    buildingSize: number;
    muretHeight: number;
    parkSize: number;
}

const textureLoader = new TextureLoader();

let brickTexture: Texture;
let concreteTexture: Texture;
let grassTexture: Texture;
let fenceTexture: Texture;

export function initializeTextures(config: TextureConfig): void {
    const { buildingSize, muretHeight, parkSize } = config;

    brickTexture = textureLoader.load('textures/brick.jpg');
    brickTexture.wrapS = RepeatWrapping;
    brickTexture.wrapT = RepeatWrapping;
    brickTexture.repeat.set(buildingSize / 2, muretHeight / 2);

    concreteTexture = textureLoader.load('textures/concrete.jpg');
    concreteTexture.wrapS = RepeatWrapping;
    concreteTexture.wrapT = RepeatWrapping;
    concreteTexture.repeat.set(buildingSize / 4, buildingSize / 4);

    grassTexture = textureLoader.load('textures/grass.jpg');
    grassTexture.wrapS = RepeatWrapping;
    grassTexture.wrapT = RepeatWrapping;
    grassTexture.repeat.set(parkSize / 15, parkSize / 15);

    fenceTexture = textureLoader.load('textures/fence.png');
    fenceTexture.wrapS = RepeatWrapping;
    fenceTexture.wrapT = RepeatWrapping;
    fenceTexture.repeat.set(parkSize / 5, 1);
}

export { brickTexture, concreteTexture, grassTexture, fenceTexture }; 