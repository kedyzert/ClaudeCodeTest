import { States } from "../core/GameState.js";

export class GameOverOverlay {
  constructor({ eventBus, playerState, waveManager }) {
    this.root = document.getElementById("gameover-overlay");
    this.summary = document.getElementById("gameover-summary");
    this.button = document.getElementById("gameover-restart");

    this.button.addEventListener("click", () => eventBus.emit("restart:requested"));

    eventBus.on("state:changed", ({ current }) => {
      if (current === States.GAME_OVER) {
        this.summary.textContent = `You reached wave ${waveManager.waveNumber} with a score of ${playerState.score}.`;
      }
      this.root.classList.toggle("hidden", current !== States.GAME_OVER);
    });
  }
}
