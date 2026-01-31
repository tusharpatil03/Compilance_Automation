import { useAuth } from "../../features/auth/hooks/useAuth";
import { Button } from "../../components/UI/Button";
import styles from './DashBoard.module.css';

function DashBoard() {
  const { tenant, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Welcome, {tenant?.name}!</h2>
          <div className={styles.info}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{tenant?.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Status:</span>
              <span className={`${styles.value} ${styles.statusBadge} ${styles[tenant?.status || 'active']}`}>
                {tenant?.status}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Tenant ID:</span>
              <span className={styles.value}>{tenant?.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashBoard;
