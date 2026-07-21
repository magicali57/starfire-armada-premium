import type { CompanionBehaviorInfo } from "@/data/companionDetail";
import "./CompanionBehaviorPanel.css";

interface CompanionBehaviorPanelProps {
  behavior: CompanionBehaviorInfo;
}

/**
 * "Skill & Effects" heading + ability hex icon + title/activation/summary
 * (18_Companion_Detail.png). The hex-badge treatment reuses Fleet Roster's
 * existing `.fleet-featured-panel__ability-hex` clip-path recipe (same
 * hexagon shape/border, new class name since this is a different
 * component tree) rather than inventing a new badge shape. All content
 * here is descriptive-only prototype metadata (see companionDetail.ts's
 * COMPANION_BEHAVIOR_INFO) — not connected to any real combat/targeting/
 * cooldown system.
 */
export function CompanionBehaviorPanel({ behavior }: CompanionBehaviorPanelProps) {
  return (
    <div className="companion-behavior-panel glass-panel">
      <h2 className="companion-behavior-panel__heading">
        Skill &amp; Effects <i />
      </h2>
      <div className="companion-behavior-panel__top">
        <span className="companion-behavior-panel__hex" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <path
              d="M12 2.6 20.4 7.3V16.7L12 21.4 3.6 16.7V7.3Z"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <circle cx="12" cy="12" r="3.2" fill="currentColor" opacity="0.85" />
          </svg>
        </span>
        <div className="companion-behavior-panel__copy">
          <h3 className="companion-behavior-panel__title">{behavior.title}</h3>
          <span className="companion-behavior-panel__activation">{behavior.activation}</span>
          <p className="companion-behavior-panel__summary">{behavior.summary}</p>
        </div>
      </div>
    </div>
  );
}
