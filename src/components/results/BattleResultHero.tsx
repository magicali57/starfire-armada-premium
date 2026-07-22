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
  difficulty: RewardDifficulty;
  firstClear: boolean;
  /** Only rendered when the canonical performance result genuinely
   *  supplies it — never fabricated here. */
  starsEarned?: number;
}

/** Strong Victory/Defeat hero. Victory uses the cyan/gold success
 *  language already established elsewhere (secondary + gold neon);
 *  Defeat uses the danger/primary (red/purple) language — readable, not
 *  excessively dark, per the design direction. */
export function BattleResultHero({ outcome, stageName, difficulty, firstClear, starsEarned }: BattleResultHeroProps) {
  const victory = outcome === "victory";
  return (
    <div className={`battle-result-hero battle-result-hero--${victory ? "victory" : "defeat"} glass-panel`}>
      <p className="battle-result-hero__heading">{victory ? "VICTORY" : "DEFEAT"}</p>
      <p className="battle-result-hero__stage">{stageName}</p>
      <div className="battle-result-hero__meta">
        <span className="battle-result-hero__badge">{DIFFICULTY_LABEL[difficulty]}</span>
        {victory && firstClear ? (
          <span className="battle-result-hero__badge battle-result-hero__badge--gold">First Clear</span>
        ) : null}
        {victory && typeof starsEarned === "number" ? (
          <span className="battle-result-hero__stars" aria-label={`${starsEarned} stars earned`}>
            {Array.from({ length: Math.max(0, Math.min(3, starsEarned)) }, (_, index) => (
              <BattleModeIcon key={index} variant="star" size={16} />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
