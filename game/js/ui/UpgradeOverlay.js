import { States } from "../core/GameState.js";

export class UpgradeOverlay {
  constructor({ eventBus, upgradeSystem }) {
    this.upgradeSystem = upgradeSystem;
    this.root = document.getElementById("upgrade-overlay");
    this.cardsContainer = document.getElementById("upgrade-cards");
    this.waveClearedText = document.getElementById("upgrade-wave-text");

    eventBus.on("wave:cleared", ({ wave }) => {
      this.waveClearedText.textContent = `Wave ${wave} cleared!`;
    });

    eventBus.on("upgrade:choicesReady", (choices) => this._renderChoices(choices));

    eventBus.on("state:changed", ({ current }) => {
      this.root.classList.toggle("hidden", current !== States.UPGRADE);
    });
  }

  _renderChoices(choices) {
    this.cardsContainer.innerHTML = "";
    for (const def of choices) {
      const card = document.createElement("button");
      card.className = "upgrade-card";
      card.innerHTML = `<h3>${def.name}</h3><p>${def.description}</p>`;
      card.addEventListener("click", () => this.upgradeSystem.choose(def.id));
      this.cardsContainer.appendChild(card);
    }
  }
}
