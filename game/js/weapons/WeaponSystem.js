import * as THREE from "three";
import { resetWeaponConfig } from "./WeaponConfig.js";
import { Projectile } from "./Projectile.js";
import { Grenade } from "./Grenade.js";

const WEAPON_ORDER = ["pistol", "machineGun", "rocketLauncher"];
const GRENADE_THROW_COOLDOWN = 0.6;

export class WeaponSystem {
  constructor({ scene, camera, domElement, enemyManager, eventBus, weaponConfig, playerState }) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.enemyManager = enemyManager;
    this.eventBus = eventBus;
    this.config = weaponConfig;
    this.playerState = playerState;
    this.enabled = false;

    this.activeId = "pistol";
    this.state = {};
    for (const id of WEAPON_ORDER) {
      this.state[id] = { ammoInMag: this.config[id].magSize, isReloading: false, reloadEndsAt: 0, lastFiredAt: -Infinity };
    }

    this.raycaster = new THREE.Raycaster();
    this.projectiles = [];
    this.grenades = [];
    this.lastGrenadeAt = -Infinity;

    this.viewmodels = this._buildViewmodels();
    this._updateViewmodelVisibility();

    document.addEventListener("mousedown", (e) => {
      if (!this.enabled) return;
      if (document.pointerLockElement !== this.domElement) return;
      if (e.button === 0) this.tryFire();
    });

    document.addEventListener("keydown", (e) => {
      if (!this.enabled) return;
      if (e.code === "Digit1") this.switchWeapon("pistol");
      else if (e.code === "Digit2") this.switchWeapon("machineGun");
      else if (e.code === "Digit3") this.switchWeapon("rocketLauncher");
      else if (e.code === "KeyR") this.reload();
      else if (e.code === "KeyG") this.throwGrenade();
    });
  }

  getActiveInfo() {
    const id = this.activeId;
    const cfg = this.config[id];
    const s = this.state[id];
    return { id, displayName: cfg.displayName, ammoInMag: s.ammoInMag, magSize: cfg.magSize, isReloading: s.isReloading };
  }

  switchWeapon(id) {
    if (id === this.activeId) return;
    const current = this.state[this.activeId];
    if (current.isReloading) current.isReloading = false;
    this.activeId = id;
    this._updateViewmodelVisibility();
    this.eventBus.emit("weapon:switched", this.getActiveInfo());
  }

  reload() {
    const id = this.activeId;
    const cfg = this.config[id];
    const s = this.state[id];
    if (s.isReloading || s.ammoInMag === cfg.magSize) return;
    s.isReloading = true;
    s.reloadEndsAt = performance.now() / 1000 + cfg.reloadTimeSec;
    this.eventBus.emit("weapon:reloadStarted", { id, duration: cfg.reloadTimeSec });
  }

  tryFire() {
    const id = this.activeId;
    const cfg = this.config[id];
    const s = this.state[id];
    const now = performance.now() / 1000;
    if (s.isReloading) return;
    if (s.ammoInMag <= 0) {
      this.reload();
      return;
    }
    if (now - s.lastFiredAt < 1 / cfg.fireRateRps) return;

    s.lastFiredAt = now;
    s.ammoInMag--;
    this._muzzleFlash();
    this.eventBus.emit("weapon:fired", this.getActiveInfo());

    if (cfg.fireMode === "hitscan") this._fireHitscan(cfg);
    else this._fireProjectile(cfg);

    if (s.ammoInMag === 0) this.reload();
  }

  throwGrenade() {
    if (!this.playerState.hasGrenade || this.playerState.grenadeCount <= 0) return;
    const now = performance.now() / 1000;
    if (now - this.lastGrenadeAt < GRENADE_THROW_COOLDOWN) return;
    this.lastGrenadeAt = now;
    this.playerState.grenadeCount--;

    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const direction = this.camera.getWorldDirection(new THREE.Vector3());
    const grenade = new Grenade({ origin, direction, enemyManager: this.enemyManager, eventBus: this.eventBus });
    this.scene.add(grenade.mesh);
    this.grenades.push(grenade);
    this.eventBus.emit("grenade:thrown", { remaining: this.playerState.grenadeCount });
  }

  update(dt) {
    const now = performance.now() / 1000;
    for (const id of WEAPON_ORDER) {
      const s = this.state[id];
      const cfg = this.config[id];
      if (s.isReloading && now >= s.reloadEndsAt) {
        s.isReloading = false;
        s.ammoInMag = cfg.magSize;
        this.eventBus.emit("weapon:reloadFinished", this.getActiveInfo());
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (p.dead) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.update(dt);
      if (g.dead) {
        this.scene.remove(g.mesh);
        this.grenades.splice(i, 1);
      }
    }
  }

  reset() {
    resetWeaponConfig(this.config);
    for (const id of WEAPON_ORDER) {
      this.state[id] = { ammoInMag: this.config[id].magSize, isReloading: false, reloadEndsAt: 0, lastFiredAt: -Infinity };
    }
    this.activeId = "pistol";
    this._updateViewmodelVisibility();

    for (const p of this.projectiles) this.scene.remove(p.mesh);
    this.projectiles = [];
    for (const g of this.grenades) this.scene.remove(g.mesh);
    this.grenades = [];
  }

  _fireHitscan(cfg) {
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const direction = this.camera.getWorldDirection(new THREE.Vector3());
    this.raycaster.set(origin, direction);
    const hits = this.raycaster.intersectObjects(this.enemyManager.getHitMeshes(), false);
    if (hits.length && hits[0].distance <= cfg.hitscanRange) {
      const enemy = this.enemyManager.getEnemyByMesh(hits[0].object);
      if (enemy) enemy.takeDamage(cfg.damage);
    }
  }

  _fireProjectile(cfg) {
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const direction = this.camera.getWorldDirection(new THREE.Vector3());
    const projectile = new Projectile({
      origin,
      direction,
      speed: cfg.projectileSpeed,
      damage: cfg.damage,
      splashRadius: cfg.splashRadius,
      enemyManager: this.enemyManager,
      eventBus: this.eventBus,
    });
    this.scene.add(projectile.mesh);
    this.projectiles.push(projectile);
  }

  _buildViewmodels() {
    const group = new THREE.Group();
    group.position.set(0.32, -0.28, -0.6);
    this.camera.add(group);

    const vms = {
      pistol: this._makeGunMesh(0x394047, 0.5, false),
      machineGun: this._makeGunMesh(0x2e3540, 0.75, false),
      rocketLauncher: this._makeGunMesh(0x555f52, 0.9, true),
    };
    for (const id of WEAPON_ORDER) {
      group.add(vms[id]);
      vms[id].visible = false;
    }
    return vms;
  }

  _makeGunMesh(color, length, thick) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, length), mat);
    body.position.z = -length / 2;
    group.add(body);

    if (thick) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, length * 0.8, 10), mat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.z = -length * 0.5;
      group.add(barrel);
    }

    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffdd66 }));
    flash.position.z = -length - 0.05;
    flash.visible = false;
    group.add(flash);
    group.userData.flash = flash;

    return group;
  }

  _updateViewmodelVisibility() {
    for (const id of WEAPON_ORDER) this.viewmodels[id].visible = id === this.activeId;
  }

  _muzzleFlash() {
    const vm = this.viewmodels[this.activeId];
    const flash = vm.userData.flash;
    flash.visible = true;
    clearTimeout(vm.userData.flashTimeout);
    vm.userData.flashTimeout = setTimeout(() => {
      flash.visible = false;
    }, 40);
  }
}
