import { TextureLoader, RepeatWrapping, Texture, SRGBColorSpace } from 'three';
import { buildingSize, muretHeight, parkSize } from './constants';

const textureLoader = new TextureLoader();
const textures: Record<string, Texture> = {};

export function initializeTextures(): void {
    const textureConfigs = {
        brick: { path: 'textures/brick.jpg', repeat: [buildingSize / 2, muretHeight / 2] },
        concrete: { path: 'textures/concrete.jpg', repeat: [buildingSize / 4, buildingSize / 4] },
        grass: { path: 'textures/grass.jpg', repeat: [parkSize / 15, parkSize / 15] },
        fence: { path: 'textures/fence.png', repeat: [parkSize / 5, 1] },
        willow: { path: 'textures/willow.jpg', repeat: [2, 2] },
        leaf: { path: 'textures/leaf.jpg', repeat: [3, 3] }
    };

    Object.entries(textureConfigs).forEach(([name, config]) => {
        const texture = textureLoader.load(config.path);
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.repeat.set(config.repeat[0], config.repeat[1]);
        texture.colorSpace = SRGBColorSpace;
        textures[name] = texture;
    });
}

export const brickTexture = () => textures.brick;
export const concreteTexture = () => textures.concrete;
export const grassTexture = () => textures.grass;
export const fenceTexture = () => textures.fence;
export const willowTexture = () => textures.willow;
export const leafTexture = () => textures.leaf;
