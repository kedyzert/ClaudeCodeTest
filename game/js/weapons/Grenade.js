import * as THREE from "three";

const GRAVITY = -18;

export class Grenade {
  constructor({
    origin,
    direction,
    throwSpeed = 14,
    fuseSec = 1.5,
    slowRadius = 5,
    slowMultiplier = 0.35,
    slowDurationSec = 4,
    enemyManager,
    eventBus,
  }) {
    this.velocity = direction.clone().multiplyScalar(throwSpeed);
    this.velocity.y += 4; // small upward lob
    this.fuseRemaining = fuseSec;
    this.slowRadius = slowRadius;
    this.slowMultiplier = slowMultiplier;
    this.slowDurationSec = slowDurationSec;
    this.enemyManager = enemyManager;
    this.eventBus = eventBus;
    this.dead = false;

    const geo = new THREE.SphereGeometry(0.15, 10, 10);
    const mat = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x3399ff, emissiveIntensity: 0.4 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(origin);
  }

  update(dt) {
    if (this.dead) return;
    this.velocity.y += GRAVITY * dt;
    this.mesh.position.addScaledVector(this.velocity, dt);
    if (this.mesh.position.y < 0.15) {
      this.mesh.position.y = 0.15;
      this.velocity.y = 0;
      this.velocity.x *= 0.7;
      this.velocity.z *= 0.7;
    }
    this.fuseRemaining -= dt;
    if (this.fuseRemaining <= 0) this._detonate();
  }

  _detonate() {
    this.dead = true;
    const point = this.mesh.position.clone();
    const hits = this.enemyManager.getEnemiesInRadius(point, this.slowRadius);
    for (const enemy of hits) enemy.applySlow(this.slowMultiplier, this.slowDurationSec);
    this.eventBus.emit("grenade:detonated", { point, radius: this.slowRadius });
  }
}
