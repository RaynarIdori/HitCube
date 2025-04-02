import { PerspectiveCamera } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { defaultFov, zoomedFov } from './constants';

export interface MoveState {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
}

export interface CommandState {
    moveState: MoveState;
    isAiming: boolean;
    targetFov: number;
}

export function initializeCommandHandling(controls: PointerLockControls, _camera: PerspectiveCamera): CommandState {
    const commandState: CommandState = {
        moveState: {
            forward: false,
            backward: false,
            left: false,
            right: false,
        },
        isAiming: false,
        targetFov: defaultFov,
    };

    const isFrenchLayout = navigator.language.toLowerCase().startsWith('fr');

    const onKeyDown = (event: KeyboardEvent) => {
        switch (event.code) {
            case 'ArrowUp':
            case (isFrenchLayout ? 'KeyZ' : 'KeyW'):
                commandState.moveState.forward = true; break;
            case 'ArrowLeft':
            case (isFrenchLayout ? 'KeyQ' : 'KeyA'):
                commandState.moveState.left = true; break;
            case 'ArrowDown':
            case 'KeyS':
                commandState.moveState.backward = true; break;
            case 'ArrowRight':
            case 'KeyD':
                commandState.moveState.right = true; break;

            case 'Space':
                event.preventDefault();
                if (controls.isLocked) {
                    commandState.isAiming = !commandState.isAiming;
                    commandState.targetFov = commandState.isAiming ? zoomedFov : defaultFov;
                    if (commandState.isAiming) {
                        console.log('Space -> Aiming ON, Adding scoped class');
                        document.body.classList.add('scoped');
                    } else {
                        console.log('Space -> Aiming OFF, Removing scoped class');
                        document.body.classList.remove('scoped');
                    }
                } else {
                    console.log('Space pressed but pointer not locked');
                }
                break;
        }
    };

    const onKeyUp = (event: KeyboardEvent) => {
        switch (event.code) {
            case 'ArrowUp':
            case (isFrenchLayout ? 'KeyZ' : 'KeyW'):
                commandState.moveState.forward = false; break;
            case 'ArrowLeft':
            case (isFrenchLayout ? 'KeyQ' : 'KeyA'):
                commandState.moveState.left = false; break;
            case 'ArrowDown':
            case 'KeyS':
                commandState.moveState.backward = false; break;
            case 'ArrowRight':
            case 'KeyD':
                commandState.moveState.right = false; break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return commandState;
} 