import * as THREE from "three";

export class Projectile {
  constructor({ origin, direction, speed, damage, splashRadius, enemyManager, eventBus, maxRange = 60 }) {
    this.velocity = direction.clone().multiplyScalar(speed);
    this.damage = damage;
    this.splashRadius = splashRadius;
    this.enemyManager = enemyManager;
    this.eventBus = eventBus;
    this.traveled = 0;
    this.maxRange = maxRange;
    this.dead = false;

    const geo = new THREE.ConeGeometry(0.08, 0.32, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff5533, emissive: 0xff2200, emissiveIntensity: 0.6 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(origin);
    this.mesh.lookAt(origin.clone().add(direction));
    this.mesh.rotateX(Math.PI / 2);
  }

  update(dt) {
    if (this.dead) return;
    const step = this.velocity.clone().multiplyScalar(dt);
    this.mesh.position.add(step);
    this.traveled += step.length();

    const hitEnemy = this.enemyManager.getClosestEnemyWithinRadius(this.mesh.position, 0.6);
    if (hitEnemy || this.traveled >= this.maxRange || this.mesh.position.y < 0) {
      this._detonate();
    }
  }

  _detonate() {
    this.dead = true;
    const point = this.mesh.position.clone();
    const hits = this.enemyManager.getEnemiesInRadius(point, this.splashRadius);
    for (const enemy of hits) {
      const dist = enemy.mesh.position.distanceTo(point);
      const falloff = Math.max(0, 1 - dist / this.splashRadius);
      enemy.takeDamage(this.damage * falloff);
    }
    this.eventBus.emit("weapon:explosion", { point, radius: this.splashRadius });
  }
}
