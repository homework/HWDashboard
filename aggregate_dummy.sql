USE bandwidth_data;
DELETE FROM bandwidth_hours WHERE 1;
INSERT INTO bandwidth_hours (date, hour, ip, bytes) VALUES ( DATE( DATE_SUB( NOW(), INTERVAL 1 HOUR)), HOUR(SUBTIME(NOW(), '0 1:0:0')), "1.1.1.4", 256000 );
INSERT INTO bandwidth_hours (date, hour, ip, bytes) VALUES ( DATE( DATE_SUB( NOW(), INTERVAL 1 HOUR)), HOUR(SUBTIME(NOW(), '0 1:0:0')), "1.1.1.7", 256000 );
