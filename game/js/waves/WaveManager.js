import { getWaveStats } from "../enemies/EnemyConfig.js";

export class WaveManager {
  constructor({ enemyManager, spawnPoints, eventBus }) {
    this.enemyManager = enemyManager;
    this.spawnPoints = spawnPoints;
    this.eventBus = eventBus;
    this.waveNumber = 0;
    this.remainingToSpawn = 0;
    this.spawnTimer = 0;
    this.stats = null;
    this.active = false;
  }

  startWave(n) {
    this.waveNumber = n;
    this.stats = getWaveStats(n);
    this.remainingToSpawn = this.stats.count;
    this.spawnTimer = 0;
    this.active = true;
    this.eventBus.emit("wave:started", { wave: n, stats: this.stats });
  }

  update(dt) {
    if (!this.active) return;

    if (this.remainingToSpawn > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const spawnPoint = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        this.enemyManager.spawnEnemy(spawnPoint.clone(), {
          health: this.stats.health,
          speed: this.stats.speed,
          tier: this.waveNumber,
        });
        this.remainingToSpawn--;
        this.spawnTimer = this.stats.spawnInterval;
      }
    } else if (this.enemyManager.getAliveCount() === 0) {
      this.active = false;
      this.eventBus.emit("wave:cleared", { wave: this.waveNumber });
    }
  }

  reset() {
    this.waveNumber = 0;
    this.remainingToSpawn = 0;
    this.active = false;
  }
}
