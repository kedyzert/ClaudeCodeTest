export function createDefaultWeaponConfig() {
  return {
    pistol: {
      id: "pistol",
      displayName: "Pistol",
      fireMode: "hitscan",
      damage: 25,
      fireRateRps: 3,
      magSize: 12,
      reloadTimeSec: 1.2,
      hitscanRange: 100,
    },
    machineGun: {
      id: "machineGun",
      displayName: "Machine Gun",
      fireMode: "hitscan",
      damage: 12,
      fireRateRps: 10,
      magSize: 40,
      reloadTimeSec: 2.0,
      hitscanRange: 80,
    },
    rocketLauncher: {
      id: "rocketLauncher",
      displayName: "Rocket Launcher",
      fireMode: "projectile",
      damage: 100,
      splashRadius: 4,
      fireRateRps: 0.75,
      magSize: 2,
      reloadTimeSec: 3.0,
      projectileSpeed: 25,
    },
  };
}

// Upgrades mutate the live config object in place, so on restart we copy
// fresh default values back into it rather than swapping the reference
// (other systems hold a reference to the same live object).
export function resetWeaponConfig(liveConfig) {
  const fresh = createDefaultWeaponConfig();
  for (const key of Object.keys(fresh)) {
    Object.assign(liveConfig[key], fresh[key]);
  }
}
