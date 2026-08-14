import * as THREE from "three";
import { Enemy } from "./Enemy.js";

export class EnemyManager {
  constructor({ scene, breachPoint, eventBus }) {
    this.scene = scene;
    this.breachPoint = breachPoint;
    this.eventBus = eventBus;
    this.enemies = [];
    this.meshToEnemy = new Map();
    this.breachRadius = 1.2;
  }

  spawnEnemy(position, stats) {
    const shade = Math.max(0.28, 0.5 - (stats.tier || 0) * 0.02);
    const color = new THREE.Color().setHSL(0.02, 0.55, shade);
    const enemy = new Enemy({ position, health: stats.health, speed: stats.speed, breachPoint: this.breachPoint, color });
    this.scene.add(enemy.mesh);
    this.meshToEnemy.set(enemy.hitMesh.uuid, enemy);
    this.enemies.push(enemy);
    return enemy;
  }

  update(dt) {
    const now = performance.now() / 1000;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const wasAdvancing = enemy.state === "advancing";
      enemy.update(dt, now);

      if (wasAdvancing && enemy.state === "advancing" && enemy.distanceToBreach() <= this.breachRadius) {
        enemy.state = "breached";
        this.eventBus.emit("game:over");
      } else if (wasAdvancing && enemy.state === "dying") {
        this.eventBus.emit("enemy:killed", { position: enemy.mesh.position.clone() });
      }

      if (enemy.state === "dead") {
        this.scene.remove(enemy.mesh);
        this.meshToEnemy.delete(enemy.hitMesh.uuid);
        this.enemies.splice(i, 1);
      }
    }
  }

  getHitMeshes() {
    return this.enemies.filter((e) => e.state === "advancing").map((e) => e.hitMesh);
  }

  getEnemyByMesh(mesh) {
    return this.meshToEnemy.get(mesh.uuid);
  }

  getEnemiesInRadius(point, radius) {
    return this.enemies.filter((e) => e.state === "advancing" && e.mesh.position.distanceTo(point) <= radius);
  }

  getClosestEnemyWithinRadius(point, radius) {
    let best = null;
    let bestDist = radius;
    for (const e of this.enemies) {
      if (e.state !== "advancing") continue;
      const d = e.mesh.position.distanceTo(point);
      if (d <= bestDist) {
        best = e;
        bestDist = d;
      }
    }
    return best;
  }

  getAliveCount() {
    return this.enemies.filter((e) => e.state === "advancing" || e.state === "dying").length;
  }

  clear() {
    for (const e of this.enemies) this.scene.remove(e.mesh);
    this.enemies = [];
    this.meshToEnemy.clear();
  }
}
