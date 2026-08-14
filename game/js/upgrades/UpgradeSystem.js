import { UPGRADE_DEFINITIONS } from "./UpgradeDefinitions.js";

export class UpgradeSystem {
  constructor({ eventBus, context }) {
    this.eventBus = eventBus;
    this.context = context; // { weaponConfig, playerState }
    this.ownedStacks = new Map();
    this.currentChoices = [];
  }

  stacksOwned(id) {
    return this.ownedStacks.get(id) || 0;
  }

  generateChoices(count = 3) {
    const ctx = { ...this.context, stacksOwned: (id) => this.stacksOwned(id) };
    const eligible = UPGRADE_DEFINITIONS.filter((def) => !def.isEligible || def.isEligible(ctx));
    const pool = [...eligible];
    const picks = [];
    while (picks.length < count && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    this.currentChoices = picks;
    return picks;
  }

  choose(id) {
    const def = this.currentChoices.find((d) => d.id === id);
    if (!def) return;
    const ctx = { ...this.context, stacksOwned: (id2) => this.stacksOwned(id2) };
    def.apply(ctx);
    this.ownedStacks.set(id, this.stacksOwned(id) + 1);
    this.eventBus.emit("upgrade:applied", { id });
  }

  reset() {
    this.ownedStacks = new Map();
    this.currentChoices = [];
  }
}
