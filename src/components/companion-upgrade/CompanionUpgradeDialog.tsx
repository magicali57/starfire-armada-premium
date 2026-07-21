import { PrimaryButton } from "@/components/controls/PrimaryButton";
import type { UpgradeCompanionResult } from "@/store/playerStore";

type Props =
  | { kind: "success"; name: string; result: Extract<UpgradeCompanionResult, { success: true }>; onClose: () => void }
  | { kind: "message"; message: string; onClose: () => void };

export function CompanionUpgradeDialog(props: Props) {
  if (props.kind === "success") {
    return <div className="companion-upgrade-dialog" aria-live="polite"><p><strong>{props.name}</strong> upgraded from Level {props.result.previousLevel} to Level {props.result.newLevel}.</p><dl><div><dt>Credits spent</dt><dd>{props.result.creditsSpent.toLocaleString()}</dd></div><div><dt>Companion Data spent</dt><dd>{props.result.companionDataSpent.toLocaleString()}</dd></div><div><dt>Power increase</dt><dd>+{(props.result.newPower - props.result.previousPower).toLocaleString()}</dd></div></dl><PrimaryButton fullWidth onClick={props.onClose}>Continue</PrimaryButton></div>;
  }
  return <div className="companion-upgrade-dialog"><p>{props.message}</p><PrimaryButton fullWidth onClick={props.onClose}>Close</PrimaryButton></div>;
}
