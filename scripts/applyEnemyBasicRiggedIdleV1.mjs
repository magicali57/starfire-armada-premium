import fs from "node:fs";

const path = "src/gameplay/rapidFire/pixiRenderer.ts";
let source = fs.readFileSync(path, "utf8");
const marker = "[enemy-basic-rigged-idle-v1]";

if (source.includes(marker)) {
  console.info(`${marker} already applied.`);
  process.exit(0);
}

const rigClasses = `

/**
 * ${marker}
 * Deterministic three-part rig made from the known-good static enemy texture.
 * The body remains stable while the two wings rotate around fixed roots. This
 * produces real silhouette movement without swapping independently generated
 * images or changing the ship's colour/detail between frames.
 */
type BasicEnemyRig = {
  root: Container;
  leftWing: Sprite;
  rightWing: Sprite;
  body: Sprite;
};

class BasicEnemyRigPool {
  private pool: BasicEnemyRig[] = [];
  private idx = 0;
  private readonly leftTexture: Texture;
  private readonly rightTexture: Texture;
  private readonly bodyTexture: Texture;
  private readonly sourceW: number;
  private readonly sourceH: number;
  private readonly leftBaseX: number;
  private readonly rightBaseX: number;
  private readonly wingBaseY: number;
  private readonly bodyBaseX: number;

  constructor(
    private readonly layer: Container,
    base: Texture,
    generatedTextures: Texture[],
  ) {
    this.sourceW = base.width;
    this.sourceH = base.height;

    const leftEnd = Math.max(1, Math.floor(this.sourceW * 0.47));
    const bodyStart = Math.max(0, Math.floor(this.sourceW * 0.32));
    const bodyEnd = Math.min(this.sourceW, Math.ceil(this.sourceW * 0.68));
    const rightStart = Math.min(this.sourceW - 1, Math.floor(this.sourceW * 0.53));

    this.leftTexture = new Texture({
      source: base.source,
      frame: new Rectangle(0, 0, leftEnd, this.sourceH),
    });
    this.bodyTexture = new Texture({
      source: base.source,
      frame: new Rectangle(bodyStart, 0, bodyEnd - bodyStart, this.sourceH),
    });
    this.rightTexture = new Texture({
      source: base.source,
      frame: new Rectangle(rightStart, 0, this.sourceW - rightStart, this.sourceH),
    });
    generatedTextures.push(this.leftTexture, this.bodyTexture, this.rightTexture);

    const leftPivotX = this.sourceW * 0.41;
    const rightPivotX = this.sourceW * 0.59;
    const pivotY = this.sourceH * 0.56;
    this.leftBaseX = leftPivotX - this.sourceW / 2;
    this.rightBaseX = rightPivotX - this.sourceW / 2;
    this.wingBaseY = pivotY - this.sourceH / 2;
    this.bodyBaseX = bodyStart + (bodyEnd - bodyStart) / 2 - this.sourceW / 2;
  }

  begin(): void {
    this.idx = 0;
  }

  next(): BasicEnemyRig {
    let rig = this.pool[this.idx];
    if (!rig) {
      const root = new Container();
      root.visible = false;

      const leftWing = new Sprite(this.leftTexture);
      leftWing.anchor.set((this.sourceW * 0.41) / this.leftTexture.width, 0.56);
      leftWing.position.set(this.leftBaseX, this.wingBaseY);

      const rightWing = new Sprite(this.rightTexture);
      rightWing.anchor.set(
        (this.sourceW * 0.59 - this.sourceW * 0.53) / this.rightTexture.width,
        0.56,
      );
      rightWing.position.set(this.rightBaseX, this.wingBaseY);

      // Draw the body last so it covers the two wing-root seams.
      const body = new Sprite(this.bodyTexture);
      body.anchor.set(0.5);
      body.position.set(this.bodyBaseX, 0);

      root.addChild(leftWing, rightWing, body);
      this.layer.addChild(root);
      rig = { root, leftWing, rightWing, body };
      this.pool.push(rig);
    }

    rig.root.visible = true;
    this.idx += 1;
    return rig;
  }

  applyPose(
    rig: BasicEnemyRig,
    side: number,
    wingAngle: number,
    wingSlide: number,
    hitFlash: number,
  ): void {
    rig.root.scale.set(side / this.sourceW, side / this.sourceH);

    rig.leftWing.position.set(this.leftBaseX - wingSlide, this.wingBaseY);
    rig.rightWing.position.set(this.rightBaseX + wingSlide, this.wingBaseY);
    rig.leftWing.rotation = wingAngle;
    rig.rightWing.rotation = -wingAngle;
    rig.body.position.set(this.bodyBaseX, -Math.abs(wingAngle) * 8);

    const flash = Math.max(0, Math.min(1, hitFlash));
    const gb = Math.round(255 - flash * 95);
    const tint = (255 << 16) | (gb << 8) | gb;
    rig.leftWing.tint = tint;
    rig.rightWing.tint = tint;
    rig.body.tint = tint;
  }

  end(): void {
    for (let i = this.idx; i < this.pool.length; i += 1) {
      this.pool[i].root.visible = false;
    }
  }

  destroy(): void {
    for (const rig of this.pool) rig.root.destroy({ children: true });
    this.pool = [];
    this.idx = 0;
  }
}
`;

const classAnchor = "\n\nexport class PixiRenderer";
if (!source.includes(classAnchor)) throw new Error("Could not find PixiRenderer class anchor.");
source = source.replace(classAnchor, `${rigClasses}${classAnchor}`);

const poolField = "  private enemyPool: SpritePool | null = null;";
if (!source.includes(poolField)) throw new Error("Could not find enemyPool field.");
source = source.replace(
  poolField,
  `${poolField}\n  private basicEnemyRigPool: BasicEnemyRigPool | null = null;`,
);

const enemyPoolBlock = `    this.enemyPool = new SpritePool(this.layerWorld, () => {
      const s = new Sprite(Texture.EMPTY);
      s.anchor.set(0.5);
      return s;
    });`;
if (!source.includes(enemyPoolBlock)) throw new Error("Could not find enemy pool construction.");
source = source.replace(
  enemyPoolBlock,
  `${enemyPoolBlock}\n    const basicEnemyTexture = this.textures.enemyBasic;\n    if (basicEnemyTexture) {\n      this.basicEnemyRigPool = new BasicEnemyRigPool(\n        this.layerWorld,\n        basicEnemyTexture,\n        this.generatedTextures,\n      );\n    }`,
);

const syncStart = `    const glowPool = this.enemyGlowPool!;
    pool.begin();`;
if (!source.includes(syncStart)) throw new Error("Could not find syncEnemies pool start.");
source = source.replace(
  syncStart,
  `    const glowPool = this.enemyGlowPool!;\n    const basicRigPool = this.basicEnemyRigPool;\n    basicRigPool?.begin();\n    pool.begin();`,
);

const rotAnchor = `      const rot = Math.PI + bank;

      // Dark contour first (renders behind), then the sprite itself.`;
if (!source.includes(rotAnchor)) throw new Error("Could not find enemy rotation anchor.");
const rigBranch = `      const rot = Math.PI + bank;

      if (e.kind === "basic" && basicRigPool) {
        const rigPhase =
          (s.elapsedMs / 860) * Math.PI * 2 + e.swayPhase * 2.35;
        const rigWave = Math.sin(rigPhase);
        const hover = Math.sin(rigPhase * 0.72 + 0.6) * 4.5;
        const wingAngle = rigWave * 0.115;
        const wingSlide = rigWave * 2.8;
        const rig = basicRigPool.next();
        rig.root.position.set(e.x + sway, e.y + recoil + hover);
        rig.root.rotation = rot;
        rig.root.alpha = alpha;
        basicRigPool.applyPose(
          rig,
          side,
          wingAngle,
          wingSlide,
          e.flashMs > 0 ? Math.min(1, e.flashMs / 90) : 0,
        );

        const gp = glowPool.next();
        gp.position.set(e.x + sway, e.y + recoil + hover - side * 0.31);
        const thrustPulse = 0.5 + 0.5 * Math.sin(rigPhase * 1.55);
        const gs = side * (0.48 + thrustPulse * 0.1);
        gp.width = gs;
        gp.height = gs;
        gp.tint = 0xff6a3c;
        gp.alpha = (0.28 + thrustPulse * 0.18) * alpha;
        continue;
      }

      // Dark contour first (renders behind), then the sprite itself.`;
source = source.replace(rotAnchor, rigBranch);

const syncEnd = `    pool.end();
    flashPool.end();`;
if (!source.includes(syncEnd)) throw new Error("Could not find syncEnemies pool end.");
source = source.replace(
  syncEnd,
  `    basicRigPool?.end();\n    pool.end();\n    flashPool.end();`,
);

const destroyAnchor = `    this.enemyPool?.destroy();`;
if (!source.includes(destroyAnchor)) throw new Error("Could not find enemyPool destroy.");
source = source.replace(
  destroyAnchor,
  `${destroyAnchor}\n    this.basicEnemyRigPool?.destroy();`,
);

fs.writeFileSync(path, source, "utf8");
console.info(`${marker} applied.`);
