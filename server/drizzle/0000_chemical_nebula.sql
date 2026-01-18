CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" integer NOT NULL,
	"external_customer_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"salt" varchar NOT NULL,
	"name" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"role" varchar NOT NULL,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
