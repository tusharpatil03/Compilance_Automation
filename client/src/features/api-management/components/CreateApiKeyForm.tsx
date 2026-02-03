import { useState } from 'react';
import { InputField } from '../../../components/UI/InputField';
import { Button } from '../../../components/UI/Button';
import { Spinner } from '../../../components/UI/Spinner';
import { createApiKey } from '../services/apiKeyService';
import type { CreateApiKeyRequest } from '../types/apiKey.types';
import styles from './CreateApiKeyForm.module.css';

interface CreateApiKeyFormProps {
  onCreated: (rawKey: string) => void;
  onRefreshList?: () => void;
}

export function CreateApiKeyForm({ onCreated, onRefreshList }: CreateApiKeyFormProps) {
  const [label, setLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const payload: CreateApiKeyRequest = {
      label: label.trim() || undefined,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    };

    try {
      const res = await createApiKey(payload);
      setSuccess(res.message);
      onCreated(res.api_key);
      if (onRefreshList) onRefreshList();
      setLabel('');
      setExpiresAt('');
    } catch (err: unknown) {
      let msg = 'Failed to create API key';
      const maybeErr = err as { response?: { data?: { message?: string } } };
      msg = maybeErr.response?.data?.message || msg;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Create API Key</h2>
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}
      <InputField
        label="Label (optional)"
        name="label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g., CI integration"
        disabled={isLoading}
      />
      <InputField
        label="Expires At (optional)"
        name="expiresAt"
        type="datetime-local"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
        helperText="Set an expiry date/time for this key"
        disabled={isLoading}
      />
      <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
        Create Key
      </Button>
      {isLoading && (
        <div className={styles.loading}>
          <Spinner size="small" />
        </div>
      )}
    </form>
  );
}
