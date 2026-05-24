import { useState } from "react";
import { CreateWebhook } from "../../features/webhooks/components/CreateWebhook/CreateWebhook";
import { ListWebhooks } from "../../features/webhooks/components/ListWebhooks/ListWebhooks";
import styles from "./WebhooksPage.module.css";

function WebhooksPage() {
  const [refreshCounter, setRefreshCounter] = useState(0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Webhooks</h1>
      </div>

      <div className={styles.grid}>
        <div className={styles.left}>
          <CreateWebhook onCreated={() => setRefreshCounter((c) => c + 1)} />
        </div>
        <div className={styles.right}>
          <ListWebhooks refreshSignal={refreshCounter} />
        </div>
      </div>
    </div>
  );
}

export default WebhooksPage;
