import fs from "node:fs";

const path = "src/gameplay/rapidFire/animationDefs.ts";
let source = fs.readFileSync(path, "utf8");

const wrong = 'enemyBasicIdle: def("animEnemyBasicIdle", 32, 32, 8, 4, 2, 10, true)';
const correct = 'enemyBasicIdle: def("animEnemyBasicIdle", 128, 128, 8, 4, 2, 10, true)';

if (source.includes(wrong)) {
  source = source.replace(wrong, correct);
  fs.writeFileSync(path, source, "utf8");
  console.info("[enemy-basic-idle-test] Corrected frame size to 128x128.");
} else if (source.includes(correct)) {
  console.info("[enemy-basic-idle-test] Frame size already correct at 128x128.");
} else {
  throw new Error("[enemy-basic-idle-test] Could not find the enemyBasicIdle definition to correct.");
}
