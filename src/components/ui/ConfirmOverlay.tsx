import { createPortal } from 'react-dom';
import styles from './ConfirmOverlay.module.css';

interface ConfirmOverlayProps {
  message: string;
  icon?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmOverlay({
  message,
  icon = '👀',
  confirmLabel,
  cancelLabel = 'Annuler',
  danger,
  disabled,
  onConfirm,
  onCancel,
}: ConfirmOverlayProps) {
  return createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.message}>{message}</div>
        <div className={styles.icon}>{icon}</div>
        <button
          className={`${styles.confirmBtn} ${danger ? styles.confirmBtnDanger : ''}`}
          onClick={onConfirm}
          disabled={disabled}
        >
          {confirmLabel}
        </button>
        <button className={styles.cancelBtn} onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>,
    document.getElementById('root')!,
  );
}
