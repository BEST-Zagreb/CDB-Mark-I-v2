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
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`fr_goal` real,
	`created_at` text,
	`updated_at` text
);
