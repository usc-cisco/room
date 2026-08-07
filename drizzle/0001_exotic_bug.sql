CREATE TABLE `schedule` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`course_code` text NOT NULL,
	`course_description` text NOT NULL,
	`group` text NOT NULL,
	`program` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "schedule_day_of_week_range" CHECK("schedule"."day_of_week" between 0 and 6),
	CONSTRAINT "schedule_start_time_format" CHECK("schedule"."start_time" glob '[0-2][0-9]:[0-5][0-9]'),
	CONSTRAINT "schedule_end_time_format" CHECK("schedule"."end_time" glob '[0-2][0-9]:[0-5][0-9]'),
	CONSTRAINT "schedule_time_order" CHECK("schedule"."end_time" > "schedule"."start_time")
);
--> statement-breakpoint
CREATE INDEX `schedule_roomId_dayOfWeek_idx` ON `schedule` (`room_id`,`day_of_week`);