import * as THREE from "three";

const DEATH_ANIM_SEC = 0.3;

export class Enemy {
  constructor({ position, health, speed, breachPoint, color = 0xcc4433 }) {
    this.maxHealth = health;
    this.health = health;
    this.baseSpeed = speed;
    this.breachPoint = breachPoint;
    this.state = "advancing"; // advancing | dying | dead | breached
    this.slowUntil = 0;
    this.slowMultiplier = 1;
    this.jitterPhase = Math.random() * Math.PI * 2;
    this.deathTimer = 0;

    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 4, 8), mat);
    body.position.y = 0.75;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), mat);
    head.position.y = 1.45;
    head.castShadow = true;
    group.add(head);

    group.position.copy(position);
    this.mesh = group;
    this.hitMesh = body;
  }

  update(dt, now) {
    if (this.state !== "advancing") {
      if (this.state === "dying") {
        this.deathTimer += dt;
        const t = Math.min(1, this.deathTimer / DEATH_ANIM_SEC);
        this.mesh.scale.setScalar(1 - t);
        if (t >= 1) this.state = "dead";
      }
      return;
    }

    let speed = this.baseSpeed;
    if (now < this.slowUntil) speed *= this.slowMultiplier;

    const dir = new THREE.Vector3().subVectors(this.breachPoint, this.mesh.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.0001) dir.normalize();

    const lateral = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(Math.sin(now * 2 + this.jitterPhase) * 0.3);

    this.mesh.position.addScaledVector(dir, speed * dt);
    this.mesh.position.addScaledVector(lateral, dt);
    this.mesh.position.y = 0;
  }

  takeDamage(amount) {
    if (this.state !== "advancing") return;
    this.health -= amount;
    if (this.health <= 0) this.state = "dying";
  }

  applySlow(multiplier, durationSec) {
    this.slowMultiplier = multiplier;
    this.slowUntil = performance.now() / 1000 + durationSec;
  }

  distanceToBreach() {
    return this.mesh.position.distanceTo(this.breachPoint);
  }
}
