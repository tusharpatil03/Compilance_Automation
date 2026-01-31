import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white';
}

export function Spinner({ size = 'medium', color = 'primary' }: SpinnerProps) {
  return (
    <div className={`${styles.spinner} ${styles[size]} ${styles[color]}`}>
      <div className={styles.ring}></div>
    </div>
  );
}