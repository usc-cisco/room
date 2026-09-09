PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_allowlist` (
	`id` text PRIMARY KEY NOT NULL,
	`usc_id` text NOT NULL,
	`name` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_allowlist`("id", "usc_id", "name", "created_at") SELECT "id", "usc_id", "name", "created_at" FROM `allowlist`;--> statement-breakpoint
DROP TABLE `allowlist`;--> statement-breakpoint
ALTER TABLE `__new_allowlist` RENAME TO `allowlist`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `allowlist_usc_id_unique` ON `allowlist` (`usc_id`);