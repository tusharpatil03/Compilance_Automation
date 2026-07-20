import { useCallback, useMemo, useState } from "react";
import { InputField } from "../../../../components/Form/InputField";
import { Button } from "../../../../components/UI/Button";
import { Spinner } from "../../../../components/UI/Spinner";
import { useForm } from "../../../../hooks/formHooks";
import { useFormValidation } from "../../../../hooks/useValidation";
import { validateHttpsUrl } from "../../../../utils/validation";
import { useCreateWebhook } from "../../hooks/createWebhook";
import { WEBHOOK_EVENTS, type WebhookEvent } from "../../types/types";
import styles from "./style.module.css";

type FormData = {
  url: string;
};

interface CreateWebhookProps {
  onCreated?: () => void;
}

export function CreateWebhook({ onCreated }: CreateWebhookProps) {
  const { values, handleChange, resetForm, clearErrors } = useForm<FormData>({
    url: "",
  });
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [commonError, setCommonError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    errors: validationErrors,
    validateFields,
    clearAllErrors,
    setError,
  } = useFormValidation();

  const { createWebhook, loading } = useCreateWebhook();

  const displayErrors = useMemo(
    () => ({
      url: validationErrors.url,
    }),
    [validationErrors.url],
  );

  const toggleEvent = useCallback((event: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearErrors();
      setCommonError(null);
      setSuccess(null);

      const validations = {
        url: validateHttpsUrl(values.url),
      };

      if (!validateFields(validations)) {
        return;
      }

      clearAllErrors();

      const result = await createWebhook({
        url: values.url.trim(),
        events: selectedEvents,
      });

      if (result.ok) {
        setSuccess(result.response.message);
        resetForm();
        setSelectedEvents([]);
        onCreated?.();
        return;
      }

      if (result.error.type === "validation" && result.error.field) {
        setError(result.error.field, result.error.message);
      } else {
        setCommonError(result.error.message || "Failed to create webhook");
      }
    },
    [
      clearErrors,
      clearAllErrors,
      createWebhook,
      onCreated,
      resetForm,
      selectedEvents,
      setError,
      validateFields,
      values.url,
    ],
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Create Webhook</h2>

      {commonError && <div className={styles.error}>{commonError}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <InputField
        label="Webhook URL"
        name="url"
        type="url"
        value={values.url}
        onChange={handleChange}
        error={displayErrors.url}
        placeholder="https://example.com/webhooks/tenant"
        helperText="Must be a valid HTTPS URL"
        disabled={loading}
        required
      />

      <div className={styles.eventsSection}>
        <div className={styles.eventsTitle}>Events (optional)</div>
        <div className={styles.eventsGrid}>
          {WEBHOOK_EVENTS.map((event) => (
            <label key={event} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedEvents.includes(event)}
                onChange={() => toggleEvent(event)}
                disabled={loading}
              />
              <span>{event}</span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" variant="primary" fullWidth isLoading={loading}>
        Create Webhook
      </Button>

      {loading && (
        <div className={styles.loading}>
          <Spinner size="small" />
        </div>
      )}
    </form>
  );
}
