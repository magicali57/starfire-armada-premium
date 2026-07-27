import fs from "node:fs";

const path = "src/store/playerStore.tsx";
let source = fs.readFileSync(path, "utf8");

const productionSaveKey = 'const SAVE_KEY = "starfire-armada-v2:save";';
const previewSaveKey = `const SAVE_KEY = "starfire-armada-v2:enemy-rigged-idle-v1-save";
const ENEMY_RIG_PREVIEW_ENERGY = 100;`;

if (source.includes(productionSaveKey)) {
  source = source.replace(productionSaveKey, previewSaveKey);
} else if (!source.includes("starfire-armada-v2:enemy-rigged-idle-v1-save")) {
  throw new Error("Could not isolate the rig preview save key.");
}

const productionLoadReturn = `  if (loaded.shouldPersist) persistPlayerState(loaded.state);
  return loaded.state;`;
const previewLoadReturn = `  const previewState: PlayerState = {
    ...loaded.state,
    currencies: {
      ...loaded.state.currencies,
      energy: Math.max(loaded.state.currencies.energy, ENEMY_RIG_PREVIEW_ENERGY),
    },
  };
  if (loaded.shouldPersist || previewState.currencies.energy !== loaded.state.currencies.energy) {
    persistPlayerState(previewState);
  }
  return previewState;`;

if (source.includes(productionLoadReturn)) {
  source = source.replace(productionLoadReturn, previewLoadReturn);
} else if (!source.includes("ENEMY_RIG_PREVIEW_ENERGY")) {
  throw new Error("Could not apply the rig preview Energy grant.");
}

fs.writeFileSync(path, source, "utf8");
console.info("[enemy-rig-preview] Using isolated save data with at least 100 Energy.");
