import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'normal' | 'large';
  block?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantMap = {
  primary: styles.btnPrimary,
  secondary: styles.btnSecondary,
  danger: styles.btnDanger,
  success: styles.btnSuccess,
};

export default function Button({
  variant = 'primary',
  size = 'normal',
  block = false,
  icon,
  children,
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    variantMap[variant],
    size === 'large' ? styles.btnLarge : '',
    block ? styles.btnBlock : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {icon && <span className={styles.btnIcon} aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
