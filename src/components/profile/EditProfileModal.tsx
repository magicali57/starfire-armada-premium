import { useEffect, useState } from "react";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { PROFILE_AVATARS, validateDisplayName } from "@/data/playerProfile";
import type { UpdateProfileResult } from "@/store/playerStore";
import "./EditProfileModal.css";

interface EditProfileModalProps {
  open: boolean;
  initialName: string;
  initialAvatarId: string;
  onCancel: () => void;
  onSave: (input: { displayName: string; avatarId: string }) => UpdateProfileResult;
}

/**
 * Small in-app Edit Profile modal (display name + built-in avatar only).
 * Never commits an invalid name — validateDisplayName (data/playerProfile)
 * is the single source of truth for the rule set, shared with the store's
 * own applyUpdatePlayerProfileState guard, so a name that fails here could
 * never have been saved anyway. On any validation failure the previous
 * saved name/avatar remain untouched in the store; only the inline message
 * changes. No browser alert/prompt/confirm is ever used.
 */
export function EditProfileModal({
  open,
  initialName,
  initialAvatarId,
  onCancel,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(initialName);
  const [avatarId, setAvatarId] = useState(initialAvatarId);
  const [error, setError] = useState<string | null>(null);

  // Reset the draft to the currently-saved values every time the modal
  // opens, so a previous cancelled/failed edit never leaks into the next.
  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setAvatarId(initialAvatarId);
    setError(null);
  }, [open, initialName, initialAvatarId]);

  const handleSave = () => {
    const validation = validateDisplayName(name);
    if (!validation.valid) {
      setError(validation.reason ?? "Enter a valid name.");
      return;
    }
    const result = onSave({ displayName: validation.value, avatarId });
    if (!result.success) {
      setError(result.reason === "invalid-avatar" ? "Select a valid avatar." : "Enter a valid name.");
    }
  };

  const handleCancel = () => {
    setError(null);
    onCancel();
  };

  return (
    <ModalLayer open={open} title="Edit Profile" onClose={handleCancel}>
      <div className="edit-profile">
        <label className="edit-profile__field">
          <span>Display Name</span>
          <input
            type="text"
            className="edit-profile__input"
            value={name}
            maxLength={32}
            autoComplete="off"
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            aria-invalid={error !== null}
            aria-describedby={error !== null ? "edit-profile-error" : undefined}
          />
        </label>
        {error !== null ? (
          <p id="edit-profile-error" className="edit-profile__error" role="alert">
            {error}
          </p>
        ) : null}

        <span className="edit-profile__field-label">Avatar</span>
        <div className="edit-profile__avatars" role="radiogroup" aria-label="Avatar">
          {PROFILE_AVATARS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`edit-profile__avatar edit-profile__avatar--${option.accent}${
                avatarId === option.id ? " is-selected" : ""
              }`}
              onClick={() => setAvatarId(option.id)}
              role="radio"
              aria-checked={avatarId === option.id}
              aria-label={option.label}
            >
              <span aria-hidden="true">{option.glyph}</span>
            </button>
          ))}
        </div>

        <div className="edit-profile__actions">
          <SecondaryButton fullWidth onClick={handleCancel}>
            Cancel
          </SecondaryButton>
          <PrimaryButton fullWidth onClick={handleSave}>
            Save
          </PrimaryButton>
        </div>
      </div>
    </ModalLayer>
  );
}
