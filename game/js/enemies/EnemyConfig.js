export const ENEMY_BASE = {
  baseHealth: 40,
  healthGrowth: 1.12, // compounding per wave
  baseSpeed: 2.2,
  speedGrowth: 1.04, // compounding per wave
  maxSpeed: 6,
  baseCount: 5,
  countGrowth: 0.25, // roughly linear per wave
  baseSpawnInterval: 1.5,
  minSpawnInterval: 0.4,
  spawnIntervalDecay: 0.92,
};

export function getWaveStats(wave) {
  const b = ENEMY_BASE;
  return {
    count: Math.floor(b.baseCount * (1 + b.countGrowth * (wave - 1))),
    spawnInterval: Math.max(b.minSpawnInterval, b.baseSpawnInterval * Math.pow(b.spawnIntervalDecay, wave - 1)),
    health: Math.round(b.baseHealth * Math.pow(b.healthGrowth, wave - 1)),
    speed: Math.min(b.maxSpeed, b.baseSpeed * Math.pow(b.speedGrowth, wave - 1)),
  };
}
