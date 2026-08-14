import { States } from "../core/GameState.js";

// Shared between the initial start screen and the Escape-triggered pause
// screen, since both are "click to (re-)enter the game" moments.
export class MenuOverlay {
  constructor({ eventBus, gameState, playerController }) {
    this.root = document.getElementById("menu-overlay");
    this.title = document.getElementById("menu-title");
    this.subtitle = document.getElementById("menu-subtitle");
    this.button = document.getElementById("menu-button");

    this.button.addEventListener("click", () => playerController.lock());

    eventBus.on("state:changed", ({ current }) => this._render(current));
    this._render(gameState.current);
  }

  _render(state) {
    if (state === States.MENU) {
      this.title.textContent = "Wave Defense";
      this.subtitle.textContent = "WASD to move, mouse to aim, click to shoot. Don't let anything reach you.";
      this.button.textContent = "Click to Start";
      this.root.classList.remove("hidden");
    } else if (state === States.PAUSED) {
      this.title.textContent = "Paused";
      this.subtitle.textContent = "Click to resume";
      this.button.textContent = "Resume";
      this.root.classList.remove("hidden");
    } else {
      this.root.classList.add("hidden");
    }
  }
}
