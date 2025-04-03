import { PerspectiveCamera } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { defaultFov, zoomedFov } from '../constants/constants';

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

    const onKeyDown = (event: KeyboardEvent) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'KeyZ':
                commandState.moveState.forward = true; break;
            case 'ArrowLeft':
            case 'KeyA':
            case 'KeyQ':
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
                    document.body.classList[commandState.isAiming ? 'add' : 'remove']('scoped');
                }
                break;
        }
    };

    const onKeyUp = (event: KeyboardEvent) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
            case 'KeyZ':
                commandState.moveState.forward = false; break;
            case 'ArrowLeft':
            case 'KeyA':
            case 'KeyQ':
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