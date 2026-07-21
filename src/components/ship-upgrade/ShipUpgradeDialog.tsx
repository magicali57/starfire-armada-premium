import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { MATERIAL_ICON, RESOURCE_ICON } from "@/data/assetRegistry";
import type { ShipUpgradeMaxPreviewData, ShipUpgradeX5PreviewData } from "@/data/shipUpgrade";
import "./ShipUpgradeDialog.css";

interface ConfirmX5DialogProps {
  kind: "confirmX5";
  shipName: string;
  preview: ShipUpgradeX5PreviewData;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface MaxPreviewDialogProps {
  kind: "maxPreview";
  shipName: string;
  data: ShipUpgradeMaxPreviewData;
  onClose: () => void;
}

type ShipUpgradeDialogProps = ConfirmX5DialogProps | MaxPreviewDialogProps;

/**
 * Body content rendered inside <ModalLayer> (see ShipUpgradeScreen) for the
 * two real dialogs this screen needs: the Upgrade x5 confirmation and the
 * read-only Max Preview. Both are content-only components — ModalLayer
 * itself owns the backdrop/Escape/close-button chrome.
 */
export function ShipUpgradeDialog(props: ShipUpgradeDialogProps) {
  if (props.kind === "confirmX5") {
    const { shipName, preview, busy, onConfirm, onCancel } = props;
    const { quote, resources } = preview;
    return (
      <div className="ship-upgrade-dialog">
        <p className="ship-upgrade-dialog__intro">
          Upgrade <strong>{shipName}</strong> from Level {quote.startLevel} to Level {quote.targetLevel} (
          {quote.levels} {quote.levels === 1 ? "level" : "levels"})?
        </p>

        <div className="ship-upgrade-dialog__row">
          <span>Levels</span>
          <strong>
            {quote.startLevel} <BattleModeIcon variant="chevron" size={11} /> {quote.targetLevel}
          </strong>
        </div>
        <div className="ship-upgrade-dialog__row">
          <span>Power</span>
          <strong>
            {quote.currentPower.toLocaleString()} <BattleModeIcon variant="chevron" size={11} />{" "}
            {quote.resultingPower.toLocaleString()}
          </strong>
        </div>
        <div
          className={`ship-upgrade-dialog__row${
            resources.insufficientCoins ? " ship-upgrade-dialog__row--insufficient" : ""
          }`}
        >
          <span>
            <img src={RESOURCE_ICON.credits} alt="" /> Total Credits
          </span>
          <strong>{quote.totalCoins.toLocaleString()}</strong>
        </div>
        <div
          className={`ship-upgrade-dialog__row${
            resources.insufficientShipAlloy ? " ship-upgrade-dialog__row--insufficient" : ""
          }`}
        >
          <span>
            <img src={MATERIAL_ICON.shipAlloy} alt="" /> Total Ship Alloy
          </span>
          <strong>{quote.totalShipAlloy.toLocaleString()}</strong>
        </div>

        {!resources.canAfford ? (
          <p className="ship-upgrade-dialog__warning" role="status">
            {resources.bothInsufficient
              ? "Not enough Credits and not enough Ship Alloy for this transaction."
              : resources.insufficientCoins
                ? "Not enough Credits for this transaction."
                : "Not enough Ship Alloy for this transaction."}
          </p>
        ) : null}

        <div className="ship-upgrade-dialog__actions">
          <SecondaryButton fullWidth onClick={onCancel} disabled={busy}>
            Cancel
          </SecondaryButton>
          <PrimaryButton fullWidth onClick={onConfirm} disabled={busy || !resources.canAfford}>
            {busy ? "Upgrading…" : "Confirm"}
          </PrimaryButton>
        </div>
      </div>
    );
  }

  const { shipName, data, onClose } = props;
  return (
    <div className="ship-upgrade-dialog">
      <p className="ship-upgrade-dialog__intro">
        <strong>{shipName}</strong> at maximum level (read-only preview — nothing is purchased or changed).
      </p>

      <div className="ship-upgrade-dialog__row">
        <span>Level</span>
        <strong>
          {data.currentLevel} <BattleModeIcon variant="chevron" size={11} /> {data.maxLevel}
        </strong>
      </div>
      <div className="ship-upgrade-dialog__row">
        <span>Power</span>
        <strong>
          {data.currentPower.toLocaleString()} <BattleModeIcon variant="chevron" size={11} />{" "}
          {data.maxPower.toLocaleString()}
        </strong>
      </div>
      <div className="ship-upgrade-dialog__row">
        <span>Total Power Increase</span>
        <strong className="ship-upgrade-dialog__highlight">+{data.powerIncrease.toLocaleString()}</strong>
      </div>

      <div className="ship-upgrade-dialog__stat-list">
        {data.statRows.map((row) => (
          <div className="ship-upgrade-dialog__stat-row" key={row.key}>
            <img src={row.icon} alt="" />
            <span className="ship-upgrade-dialog__stat-label">{row.label}</span>
            <span className="ship-upgrade-dialog__stat-current">{row.current}</span>
            <BattleModeIcon variant="chevron" size={11} />
            <span className="ship-upgrade-dialog__stat-next">{row.next}</span>
          </div>
        ))}
      </div>

      <div className="ship-upgrade-dialog__actions">
        <PrimaryButton fullWidth onClick={onClose}>
          Close
        </PrimaryButton>
      </div>
    </div>
  );
}
