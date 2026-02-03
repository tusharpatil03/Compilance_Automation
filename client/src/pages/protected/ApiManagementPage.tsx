import { useState } from 'react';
import { CreateApiKeyForm } from '../../features/api-management/components/CreateApiKeyForm';
import { ApiKeysList } from '../../features/api-management/components/ApiKeysList';
import styles from './ApiManagementPage.module.css';

function ApiManagementPage() {
  const [rawKey, setRawKey] = useState<string>('');
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleCreated = (key: string) => {
    setRawKey(key);
    setRefreshCounter((c) => c + 1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>API Management</h1>
      </div>

      {rawKey && (
        <div className={styles.alert}>
          <strong>Your API Key:</strong> <span className={styles.rawKey}>{rawKey}</span><br />
          <span className={styles.note}>
            Note: This key is shown only once. Store it securely. You won't be able to see it again.
          </span>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.left}>
          <CreateApiKeyForm onCreated={handleCreated} onRefreshList={() => setRefreshCounter((c) => c + 1)} />
        </div>
        <div className={styles.right}>
          <ApiKeysList refreshSignal={refreshCounter} />
        </div>
      </div>
    </div>
  );
}

export default ApiManagementPage;
