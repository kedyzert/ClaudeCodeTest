export const States = Object.freeze({
  MENU: "MENU",
  PLAYING: "PLAYING",
  UPGRADE: "UPGRADE",
  PAUSED: "PAUSED",
  GAME_OVER: "GAME_OVER",
});

export class GameState {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.current = States.MENU;
  }

  is(state) {
    return this.current === state;
  }

  transitionTo(state) {
    if (this.current === state) return;
    const previous = this.current;
    this.current = state;
    this.eventBus.emit("state:changed", { previous, current: state });
  }
}
