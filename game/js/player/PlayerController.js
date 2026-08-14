import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { clampToBounds } from "../world/Boundaries.js";

const EYE_HEIGHT = 1.6;
const SPAWN_POSITION = { x: 0, y: EYE_HEIGHT, z: -3 };

export class PlayerController {
  constructor({ camera, domElement, bounds, playerState, eventBus }) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);
    this.bounds = bounds;
    this.playerState = playerState;
    this.eventBus = eventBus;
    this.expectingUnlock = false;
    this.move = { forward: false, back: false, left: false, right: false };

    document.addEventListener("keydown", (e) => this._setMove(e.code, true));
    document.addEventListener("keyup", (e) => this._setMove(e.code, false));

    // Distinguish our own unlock() calls from the user pressing Escape,
    // so an Escape press can trigger an auto-pause instead of being ignored.
    this.controls.addEventListener("unlock", () => {
      if (!this.expectingUnlock) {
        this.eventBus.emit("player:unexpectedUnlock");
      }
      this.expectingUnlock = false;
    });

    camera.position.set(SPAWN_POSITION.x, SPAWN_POSITION.y, SPAWN_POSITION.z);
  }

  get isLocked() {
    return this.controls.isLocked;
  }

  lock() {
    this.controls.lock();
  }

  unlock() {
    this.expectingUnlock = true;
    this.controls.unlock();
  }

  reset() {
    this.camera.position.set(SPAWN_POSITION.x, SPAWN_POSITION.y, SPAWN_POSITION.z);
    this.move = { forward: false, back: false, left: false, right: false };
  }

  _setMove(code, value) {
    switch (code) {
      case "KeyW":
      case "ArrowUp":
        this.move.forward = value;
        break;
      case "KeyS":
      case "ArrowDown":
        this.move.back = value;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.move.left = value;
        break;
      case "KeyD":
      case "ArrowRight":
        this.move.right = value;
        break;
    }
  }

  update(dt) {
    if (!this.controls.isLocked) return;

    let ix = (this.move.right ? 1 : 0) - (this.move.left ? 1 : 0);
    let iz = (this.move.forward ? 1 : 0) - (this.move.back ? 1 : 0);
    if (ix !== 0 || iz !== 0) {
      const len = Math.hypot(ix, iz);
      ix /= len;
      iz /= len;
      const dist = this.playerState.moveSpeed * dt;
      this.controls.moveRight(ix * dist);
      this.controls.moveForward(iz * dist);
    }

    const p = this.camera.position;
    clampToBounds(p, this.bounds, 0.4);
    p.y = EYE_HEIGHT;
  }
}
