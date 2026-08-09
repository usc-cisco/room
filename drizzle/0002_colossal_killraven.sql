CREATE TABLE `allowlist` (
	`id` text PRIMARY KEY NOT NULL,
	`usc_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `allowlist_usc_id_unique` ON `allowlist` (`usc_id`);