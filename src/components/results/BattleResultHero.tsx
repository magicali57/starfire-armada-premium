import type { CSSProperties } from "react";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { BattleOutcome } from "@/systems/battleSession";
import type { RewardDifficulty } from "@/types";
import "./BattleResultHero.css";

const DIFFICULTY_LABEL: Record<RewardDifficulty, string> = {
  normal: "Normal",
  hard: "Hard",
  nightmare: "Nightmare",
};

interface BattleResultHeroProps {
  outcome: BattleOutcome;
  stageName: string;
  /** e.g. "CHAPTER 1 • STAGE 3" — only when derived from real campaign data. */
  stageIdentity?: string | null;
  difficulty: RewardDifficulty;
  firstClear: boolean;
  /** Selected ship master art when available — never invents artwork. */
  shipArtSrc?: string | null;
  /** Only rendered when the canonical performance result genuinely supplies it. */
  starsEarned?: number;
}

/** Strong Victory/Defeat hero. Visual composition follows
 *  47_Victory_Results.png / 48_Defeat_Results.png — gold/cyan success vs
 *  red danger — without fabricating grades, boss names, or "New Best". */
export function BattleResultHero({
  outcome,
  stageName,
  stageIdentity,
  difficulty,
  firstClear,
  shipArtSrc,
  starsEarned,
}: BattleResultHeroProps) {
  const victory = outcome === "victory";
  const starCount = typeof starsEarned === "number" ? Math.max(0, Math.min(3, starsEarned)) : 0;

  return (
    <header className={`battle-result-hero battle-result-hero--${victory ? "victory" : "defeat"}`}>
      <div className="battle-result-hero__title-row" aria-hidden="true">
        <span className="battle-result-hero__wing battle-result-hero__wing--left" />
        <h1 className="battle-result-hero__heading">{victory ? "VICTORY" : "DEFEAT"}</h1>
        <span className="battle-result-hero__wing battle-result-hero__wing--right" />
      </div>

      {!victory ? <p className="battle-result-hero__tagline">Mission failed. Regroup and try again.</p> : null}

      <p className="battle-result-hero__stage">{stageName}</p>
      {stageIdentity ? <p className="battle-result-hero__identity">{stageIdentity}</p> : null}

      <div className="battle-result-hero__showcase">
        {shipArtSrc ? (
          <div className="battle-result-hero__ship-wrap">
            <img src={shipArtSrc} alt="" className="battle-result-hero__ship" />
          </div>
        ) : (
          <div className="battle-result-hero__ship-wrap battle-result-hero__ship-wrap--empty" aria-hidden="true" />
        )}

        {starCount > 0 ? (
          <div className="battle-result-hero__grade" aria-label={`${starCount} stars earned`}>
            <div className="battle-result-hero__stars">
              {Array.from({ length: starCount }, (_, index) => (
                <BattleModeIcon
                  key={index}
                  variant="star"
                  size={22}
                  className="motion-stagger-item"
                  style={{ "--motion-index": index } as CSSProperties}
                />
              ))}
            </div>
            <span className="battle-result-hero__stars-label">{starCount} STAR{starCount === 1 ? "" : "S"}</span>
          </div>
        ) : null}
      </div>

      <div className="battle-result-hero__meta">
        <span className="battle-result-hero__badge">{DIFFICULTY_LABEL[difficulty]}</span>
        {victory && firstClear ? (
          <span className="battle-result-hero__badge battle-result-hero__badge--gold">First Clear</span>
        ) : null}
      </div>
    </header>
  );
}
