-- Migration number: 0002 	 2024-05-21T14:14:26.154Z
CREATE UNIQUE INDEX snapshots_url_index ON snapshot (url);
