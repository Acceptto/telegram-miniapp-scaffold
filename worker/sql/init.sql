CREATE TABLE IF NOT EXISTS settings (
	name text PRIMARY KEY,
	created_date text NOT NULL,
	updated_date text NOT NULL,
	value text NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
	id integer PRIMARY KEY AUTOINCREMENT,
	created_date text NOT NULL,
	updated_date text NOT NULL,
	message text NOT NULL,
	update_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS initDataCheck (
	id integer PRIMARY KEY AUTOINCREMENT,
	created_date text NOT NULL,
	updated_date text NOT NULL,
	init_data text NOT NULL,
	expected_hash text NOT NULL,
	calculated_hash text NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
	id integer PRIMARY KEY AUTOINCREMENT,
	created_date text NOT NULL,
	updated_date text NOT NULL,
	last_auth_timestamp text NOT NULL,
	telegram_id integer UNIQUE NOT NULL,
	username text,
	is_bot integer,
	first_mame text,
	last_name text,
	language_code text,
	is_premium integer,
	added_to_attachment_menu integer,
	allows_write_to_pm integer,
	photo_url text
);

CREATE TABLE IF NOT EXISTS tokens (
	id integer PRIMARY KEY AUTOINCREMENT,
	created_date text NOT NULL,
	updated_date text NOT NULL,
	expired_date text NOT NULL,
	token_hash text UNIQUE NOT NULL,
	user_id integer NOT NULL,
	FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS calendars (
	id integer PRIMARY KEY AUTOINCREMENT,
	created_date text NOT NULL,
	updated_date text NOT NULL,
	user_id integer NOT NULL,
	calendar_json text NOT NULL,
	calendar_ref text NOT NULL,
	FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS selectedDates (
	id integer PRIMARY KEY AUTOINCREMENT,
	created_date text NOT NULL,
	updated_date text NOT NULL,
	user_id integer NOT NULL,
	calendar_id integer NOT NULL,
	selected_dates_json text NOT NULL,
	FOREIGN KEY(user_id) REFERENCES users(id),
	FOREIGN KEY(calendar_id) REFERENCES calendars(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_selected_dates_index ON selectedDates (user_id, calendar_id);

CREATE UNIQUE INDEX IF NOT EXISTS token_hash_index ON tokens (token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS telegram_id_index ON users (telegram_id);
