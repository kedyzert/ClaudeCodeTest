import { States } from "../core/GameState.js";

export class HUD {
  constructor({ eventBus, playerState }) {
    this.playerState = playerState;
    this.root = document.getElementById("hud");
    this.weaponText = document.getElementById("hud-weapon");
    this.ammoText = document.getElementById("hud-ammo");
    this.reloadText = document.getElementById("hud-reload");
    this.waveText = document.getElementById("hud-wave");
    this.scoreText = document.getElementById("hud-score");
    this.grenadeWrap = document.getElementById("hud-grenade-wrap");
    this.grenadeText = document.getElementById("hud-grenade");

    eventBus.on("state:changed", ({ current }) => {
      const visible =
        current === States.PLAYING ||
        current === States.UPGRADE ||
        current === States.PAUSED ||
        current === States.GAME_OVER;
      this.root.classList.toggle("hidden", !visible);
    });

    eventBus.on("weapon:fired", (info) => this._updateWeapon(info));
    eventBus.on("weapon:switched", (info) => this._updateWeapon(info));
    eventBus.on("weapon:reloadStarted", () => this.reloadText.classList.remove("hidden"));
    eventBus.on("weapon:reloadFinished", (info) => {
      this.reloadText.classList.add("hidden");
      this._updateWeapon(info);
    });

    eventBus.on("wave:started", ({ wave }) => {
      this.waveText.textContent = `Wave ${wave}`;
    });

    eventBus.on("score:changed", () => {
      this.scoreText.textContent = `Score: ${this.playerState.score}`;
    });

    eventBus.on("grenade:thrown", () => this._updateGrenade());
    eventBus.on("upgrade:applied", () => this._updateGrenade());

    this._updateGrenade();
    this.scoreText.textContent = "Score: 0";
    this.waveText.textContent = "Wave 1";
  }

  _updateWeapon(info) {
    this.weaponText.textContent = info.displayName;
    this.ammoText.textContent = `${info.ammoInMag} / ${info.magSize}`;
  }

  _updateGrenade() {
    if (this.playerState.hasGrenade) {
      this.grenadeWrap.classList.remove("hidden");
      this.grenadeText.textContent = `Grenades: ${this.playerState.grenadeCount}`;
    } else {
      this.grenadeWrap.classList.add("hidden");
    }
  }
}
