import { Router } from "express";
import { KycCompletedEvent, KycStatus } from "./DomainEvents/KYCCompletedEvent";
import { getEventManager } from "./runtime";

// add route
const router = Router();

router.get("/trigger_event", async (req, res) => {
    //create event in event store and outbox
    const eventPayload = {
        userId: "12345",
        status: "approved" as KycStatus,
        riskScore: 85
    }
    const event = new KycCompletedEvent(111, 101, eventPayload);

    const eventManager = getEventManager();
    await eventManager.publish(event);
    res.send("Event triggered");
});

//run worker to consume events


export default router;