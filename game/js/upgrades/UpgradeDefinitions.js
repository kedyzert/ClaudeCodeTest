// Data-driven upgrade list. Each definition: id, display name/description,
// isEligible(ctx) to filter what can currently be offered, and apply(ctx) to
// mutate live state. Adding a new upgrade later is just appending an entry.
export const UPGRADE_DEFINITIONS = [
  {
    id: "pistol_mag_plus",
    name: "Extended Pistol Mag",
    description: "+6 rounds to the pistol magazine",
    isEligible: (ctx) => ctx.stacksOwned("pistol_mag_plus") < 3,
    apply: (ctx) => {
      ctx.weaponConfig.pistol.magSize += 6;
    },
  },
  {
    id: "mg_mag_plus",
    name: "Extended MG Mag",
    description: "+15 rounds to the machine gun magazine",
    isEligible: (ctx) => ctx.stacksOwned("mg_mag_plus") < 3,
    apply: (ctx) => {
      ctx.weaponConfig.machineGun.magSize += 15;
    },
  },
  {
    id: "rocket_mag_plus",
    name: "Rocket Pouch",
    description: "+1 rocket to the launcher magazine",
    isEligible: (ctx) => ctx.stacksOwned("rocket_mag_plus") < 3,
    apply: (ctx) => {
      ctx.weaponConfig.rocketLauncher.magSize += 1;
    },
  },
  {
    id: "unlock_grenade",
    name: "Frost Grenade",
    description: "Unlocks a throwable grenade that slows nearby enemies",
    isEligible: (ctx) => !ctx.playerState.hasGrenade,
    apply: (ctx) => {
      ctx.playerState.hasGrenade = true;
      ctx.playerState.grenadeCount += 2;
    },
  },
  {
    id: "grenade_count_plus",
    name: "+2 Grenade Capacity",
    description: "Carry two more grenades",
    isEligible: (ctx) => ctx.playerState.hasGrenade,
    apply: (ctx) => {
      ctx.playerState.grenadeCount += 2;
    },
  },
  {
    id: "reload_speed",
    name: "Quick Hands",
    description: "All weapons reload 15% faster",
    isEligible: (ctx) => ctx.stacksOwned("reload_speed") < 2,
    apply: (ctx) => {
      for (const weapon of Object.values(ctx.weaponConfig)) {
        weapon.reloadTimeSec *= 0.85;
      }
    },
  },
  {
    id: "move_speed",
    name: "Light Boots",
    description: "Move 10% faster",
    isEligible: (ctx) => ctx.stacksOwned("move_speed") < 3,
    apply: (ctx) => {
      ctx.playerState.moveSpeed *= 1.1;
    },
  },
];
