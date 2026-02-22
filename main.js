import { loadState, saveState } from "./state.js";
import { createController } from "./controls.js";

let appState = loadState();

function getState() {
  return appState;
}

function setState(next) {
  appState = next;
  saveState(appState);
}

let controller;

function rerender() {
  controller.renderCurrent();
}

function boot() {
  controller = createController(getState, setState, rerender);

  if (!window.location.hash) {
    window.location.hash = "#/home";
  }

  window.addEventListener("hashchange", controller.onRouteChange);
  document.addEventListener("click", controller.onGlobalClick);
  document.addEventListener("change", controller.onChange);

  controller.renderCurrent();
}

boot();
