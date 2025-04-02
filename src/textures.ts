import { TextureLoader, RepeatWrapping, Texture } from 'three';
import { buildingSize, muretHeight, parkSize } from './constants';

const textureLoader = new TextureLoader();

function loadTexture(path: string, repeatX?: number, repeatY?: number): Texture {
    const texture = textureLoader.load(path);
    if (repeatX !== undefined && repeatY !== undefined) {
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
    }
    return texture;
}

export const brickTexture = loadTexture('textures/brick.jpg', buildingSize / 2, muretHeight / 2);
export const concreteTexture = loadTexture('textures/concrete.jpg', buildingSize / 4, buildingSize / 4);
export const grassTexture = loadTexture('textures/grass.jpg', parkSize / 15, parkSize / 15);
export const fenceTexture = loadTexture('textures/fence.png', parkSize / 5, 1);
