CREATE TABLE "tenants_api_keys" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tenants_api_keys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" integer NOT NULL,
	"kid" varchar(128) NOT NULL,
	"api_key_hash" varchar(512) NOT NULL,
	"label" varchar(255) DEFAULT '',
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"rotated_from_key_id" integer
);
--> statement-breakpoint
ALTER TABLE "tenants_api_keys" ADD CONSTRAINT "tenants_api_keys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants_api_keys" ADD CONSTRAINT "tenants_api_keys_rotated_from_key_id_tenants_api_keys_id_fk" FOREIGN KEY ("rotated_from_key_id") REFERENCES "public"."tenants_api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_tenantapikey_kid" ON "tenants_api_keys" USING btree ("kid");--> statement-breakpoint
CREATE INDEX "ix_tenantapikey_tenant" ON "tenants_api_keys" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ix_tenantapikey_tenant_status" ON "tenants_api_keys" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "ix_tenantapikey_expires" ON "tenants_api_keys" USING btree ("expires_at");