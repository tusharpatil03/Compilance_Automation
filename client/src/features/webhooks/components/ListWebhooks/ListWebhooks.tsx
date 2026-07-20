import { useEffect, useState } from "react";
import { Button } from "../../../../components/UI/Button";
import { Spinner } from "../../../../components/UI/Spinner";
import { deleteWebhook, listWebhooks } from "../../../../services/webhook";
import type { Webhook } from "../../types/types";
import styles from "./style.module.css";

interface ListWebhooksProps {
  refreshSignal?: number;
}

type PaginationMeta = {
  limit: number;
  offset: number;
  count: number;
};

export function ListWebhooks({ refreshSignal = 0 }: ListWebhooksProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    limit: 50,
    offset: 0,
    count: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchWebhooks = async () => {
    setIsLoading(true);
    setError("");

    const result = await listWebhooks({
      limit: pagination.limit,
      offset: pagination.offset,
    });

    if (result.ok) {
      setWebhooks(result.response.data || []);
      setPagination((prev) => ({
        ...prev,
        limit: result.response.pagination?.limit ?? prev.limit,
        offset: result.response.pagination?.offset ?? prev.offset,
        count: result.response.pagination?.count ?? result.response.data.length,
      }));
    } else {
      setError(result.error.message || "Failed to fetch webhooks");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void fetchWebhooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal, pagination.limit, pagination.offset]);

  const handleDelete = async (webhookId: number) => {
    setError("");

    const confirmed = window.confirm("Delete this webhook?");
    if (!confirmed) {
      return;
    }

    const result = await deleteWebhook(webhookId);
    if (result.ok) {
      await fetchWebhooks();
      return;
    }

    setError(result.error.message || "Failed to delete webhook");
  };

  const handlePrev = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  };

  const handleNext = () => {
    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Your Webhooks</h2>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {isLoading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : webhooks.length === 0 ? (
        <div className={styles.empty}>No webhooks found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>URL</th>
                <th>Events</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((hook) => (
                <tr key={hook.id}>
                  <td className={styles.url}>{hook.url}</td>
                  <td>{hook.events?.length ? hook.events.join(", ") : "-"}</td>
                  <td>{new Date(hook.created_at).toLocaleString()}</td>
                  <td>{new Date(hook.updated_at).toLocaleString()}</td>
                  <td className={styles.actions}>
                    <Button variant="secondary" size="small" onClick={() => handleDelete(hook.id)}>
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
        <Button
          variant="outline"
          size="small"
          onClick={handlePrev}
          disabled={pagination.offset === 0}
        >
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
