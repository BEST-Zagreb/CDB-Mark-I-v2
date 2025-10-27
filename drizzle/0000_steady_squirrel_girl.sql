CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `app_users` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`added_by` text,
	`last_login` text,
	`is_locked` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_users_email_unique` ON `app_users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_app_users_full_name` ON `app_users` (`full_name`);--> statement-breakpoint
CREATE INDEX `idx_app_users_last_login` ON `app_users` (`last_login`);--> statement-breakpoint
CREATE TABLE `collaborations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer,
	`project_id` integer,
	`person_id` integer,
	`responsible` text,
	`comment` text,
	`contacted` integer,
	`successful` integer,
	`letter` integer,
	`meeting` integer,
	`priority` text,
	`created_at` text,
	`updated_at` text,
	`amount` real,
	`contact_in_future` integer,
	`type` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_collaborations_company_id` ON `collaborations` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_collaborations_project_id` ON `collaborations` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_collaborations_person_id` ON `collaborations` (`person_id`);--> statement-breakpoint
CREATE INDEX `idx_collaborations_updated_at` ON `collaborations` ("updated_at" DESC);--> statement-breakpoint
CREATE INDEX `idx_collaborations_created_at` ON `collaborations` ("created_at" DESC);--> statement-breakpoint
CREATE INDEX `idx_collaborations_company_contact_future` ON `collaborations` (`company_id`,`contact_in_future`);--> statement-breakpoint
CREATE INDEX `idx_collaborations_contact_future` ON `collaborations` (`contact_in_future`);--> statement-breakpoint
CREATE INDEX `idx_collaborations_responsible_filtered` ON `collaborations` (`responsible`) WHERE "collaborations"."responsible" IS NOT NULL AND "collaborations"."responsible" != '';--> statement-breakpoint
CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`url` text,
	`address` text,
	`city` text,
	`zip` text,
	`country` text,
	`phone` text,
	`budgeting_month` text,
	`comment` text
);
--> statement-breakpoint
CREATE INDEX `idx_companies_name` ON `companies` (`name`);--> statement-breakpoint
CREATE TABLE `people` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`email` text,
	`phone` text,
	`company_id` integer,
	`function` text,
	`created_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_people_company_id` ON `people` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_people_name` ON `people` (`name`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`fr_goal` real,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_projects_created_at` ON `projects` ("created_at" DESC);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
