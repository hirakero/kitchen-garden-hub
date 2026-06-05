CREATE TABLE `checkpoint_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stage_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`order_index` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`stage_id`) REFERENCES `stage_master`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `planting_checkpoint_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`planting_id` integer NOT NULL,
	`checkpoint_master_id` integer NOT NULL,
	`completed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`planting_id`) REFERENCES `plantings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`checkpoint_master_id`) REFERENCES `checkpoint_master`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `planting_task_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`planting_id` integer NOT NULL,
	`task_master_id` integer NOT NULL,
	`scheduled_date` integer NOT NULL,
	`completed_at` integer,
	`skipped_at` integer,
	FOREIGN KEY (`planting_id`) REFERENCES `plantings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_master_id`) REFERENCES `task_master`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `plantings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`spot_id` integer NOT NULL,
	`vegetable_id` integer NOT NULL,
	`current_stage_id` integer,
	`planted_at` integer NOT NULL,
	`finished_at` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`spot_id`) REFERENCES `spots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vegetable_id`) REFERENCES `vegetable_master`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`current_stage_id`) REFERENCES `stage_master`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE TABLE `spots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stage_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vegetable_id` integer NOT NULL,
	`name` text NOT NULL,
	`order_index` integer NOT NULL,
	`description` text,
	FOREIGN KEY (`vegetable_id`) REFERENCES `vegetable_master`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stage_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`task_type` text NOT NULL,
	`days_from_stage_start` integer,
	`interval_days` integer,
	FOREIGN KEY (`stage_id`) REFERENCES `stage_master`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vegetable_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
