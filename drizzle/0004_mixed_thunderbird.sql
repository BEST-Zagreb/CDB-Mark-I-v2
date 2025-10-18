CREATE INDEX `idx_collaborations_company_id` ON `collaborations` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_collaborations_project_id` ON `collaborations` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_collaborations_person_id` ON `collaborations` (`person_id`);--> statement-breakpoint
CREATE INDEX `idx_collaborations_updated_at` ON `collaborations` ("updated_at" DESC);--> statement-breakpoint
CREATE INDEX `idx_collaborations_created_at` ON `collaborations` ("created_at" DESC);--> statement-breakpoint
CREATE INDEX `idx_collaborations_company_contact_future` ON `collaborations` (`company_id`,`contact_in_future`);--> statement-breakpoint
CREATE INDEX `idx_collaborations_responsible_filtered` ON `collaborations` (`responsible`) WHERE "collaborations"."responsible" IS NOT NULL AND "collaborations"."responsible" != '';--> statement-breakpoint
CREATE INDEX `idx_companies_name` ON `companies` (`name`);--> statement-breakpoint
CREATE INDEX `idx_people_company_id` ON `people` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_people_name` ON `people` (`name`);--> statement-breakpoint
CREATE INDEX `idx_projects_created_at` ON `projects` ("created_at" DESC);