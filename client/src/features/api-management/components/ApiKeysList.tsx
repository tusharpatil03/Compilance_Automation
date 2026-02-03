import { useEffect, useState } from 'react';
import { listApiKeys, deactivateApiKey, deleteApiKey } from '../services/apiKeyService';
import type { ApiKeyItem, PaginationMeta } from '../types/apiKey.types';
import { Button } from '../../../components/UI/Button';
import { Spinner } from '../../../components/UI/Spinner';
import styles from './ApiKeysList.module.css';

interface ApiKeysListProps {
  refreshSignal?: number; // update this to trigger refresh
}

export function ApiKeysList({ refreshSignal = 0 }: ApiKeysListProps) {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ limit: 10, offset: 0, count: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchKeys = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await listApiKeys(pagination.limit, pagination.offset);
      setKeys(res.data);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const maybeErr = err as { response?: { data?: { message?: string } } };
      setError(maybeErr.response?.data?.message || 'Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal, pagination.limit, pagination.offset]);

  const handleDeactivate = async (kid: string) => {
    setError('');
    try {
      await deactivateApiKey(kid);
      await fetchKeys();
    } catch (err: unknown) {
      const maybeErr = err as { response?: { data?: { message?: string } } };
      setError(maybeErr.response?.data?.message || 'Failed to deactivate API key');
    }
  };

  const handleDelete = async (kid: string) => {
    setError('');
    try {
      await deleteApiKey(kid);
      await fetchKeys();
    } catch (err: unknown) {
      const maybeErr = err as { response?: { data?: { message?: string } } };
      setError(maybeErr.response?.data?.message || 'Failed to delete API key');
    }
  };

  const handlePrev = () => {
    setPagination((p) => ({ ...p, offset: Math.max(0, p.offset - p.limit) }));
  };

  const handleNext = () => {
    setPagination((p) => ({ ...p, offset: p.offset + p.limit }));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Your API Keys</h2>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {isLoading ? (
        <div className={styles.loading}><Spinner /></div>
      ) : keys.length === 0 ? (
        <div className={styles.empty}>No API keys found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Label</th>
                <th>KID</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.kid}>
                  <td>{k.label || '-'}</td>
                  <td className={styles.kid}>{k.kid}</td>
                  <td>
                    <span className={`${styles.badge} ${k.status === 'active' ? styles.active : styles.inactive}`}>
                      {k.status}
                    </span>
                  </td>
                  <td>{k.expires_at ? new Date(k.expires_at).toLocaleString() : '-'}</td>
                  <td>{new Date(k.created_at).toLocaleString()}</td>
                  <td className={styles.actions}>
                    <Button 
                      variant="outline" 
                      size="small" 
                      disabled={k.status === 'inactive'}
                      onClick={() => handleDeactivate(k.kid)}
                    >
                      Deactivate
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="small"
                      onClick={() => handleDelete(k.kid)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.pagination}>
        <Button variant="outline" size="small" onClick={handlePrev} disabled={pagination.offset === 0}>
          Previous
        </Button>
        <span className={styles.pageInfo}>
          Showing {pagination.limit} starting at {pagination.offset}
        </span>
        <Button variant="outline" size="small" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
