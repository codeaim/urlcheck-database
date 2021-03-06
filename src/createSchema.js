'use strict';

const pg = require('pg');

module.exports.handler = (event, context, callback) => {
    const client = new pg.Client(process.env.DATABASE_URL);
    const sql = `
        CREATE TABLE IF NOT EXISTS "user" (
          username       VARCHAR(255) NOT NULL PRIMARY KEY,
          email          VARCHAR(255) NOT NULL UNIQUE,
          password       VARCHAR(60)  NOT NULL,
          admin          BOOLEAN      NOT NULL,
          created        TIMESTAMPZ   NOT NULL,
          modified       TIMESTAMPZ   NOT NULL,
          version        BIGINT       NOT NULL,
          credit         BIGINT       NOT NULL
        );
    
        CREATE TABLE IF NOT EXISTS "check" (
          id         VARCHAR(8)    NOT NULL PRIMARY KEY,
          username   VARCHAR(255)  NOT NULL REFERENCES "user" (username) ON DELETE CASCADE,
          name       VARCHAR(255)  NOT NULL,
          url        VARCHAR(2000) NOT NULL,
          protocol   VARCHAR(5)    NOT NULL,
          region     VARCHAR(255)  NULL,
          status     VARCHAR(7)    NOT NULL CHECK (status IN ('UP', 'DOWN', 'UNKNOWN')) DEFAULT 'UNKNOWN',
          state      VARCHAR(10)   NOT NULL CHECK (state IN ('WAITING', 'ELECTED'))     DEFAULT 'WAITING',
          created    TIMESTAMPZ    NOT NULL,
          modified   TIMESTAMPZ    NOT NULL,
          refresh    TIMESTAMPZ    NOT NULL,
          locked     TIMESTAMPZ    NULL,
          disabled   TIMESTAMPZ    NULL,
          interval   INT           NOT NULL,
          confirming BOOLEAN       NOT NULL,
          version    BIGINT        NOT NULL,
          headers    JSON          NULL
        );
    
        CREATE TABLE IF NOT EXISTS "change" (
          id          BIGSERIAL  NOT NULL PRIMARY KEY,
          check_id    VARCHAR(8) NOT NULL REFERENCES "check" (id) ON DELETE CASCADE,
          status      VARCHAR(4) NOT NULL CHECK (status IN ('UP', 'DOWN')),
          status_code INT        NOT NULL,
          created     TIMESTAMPZ NOT NULL
        );
    
        CREATE TABLE IF NOT EXISTS "response" (
          id       BIGSERIAL    NOT NULL PRIMARY KEY,
          check_id VARCHAR(8)   NOT NULL REFERENCES "check" (id) ON DELETE CASCADE,
          duration INT          NOT NULL,
          region   VARCHAR(255) NULL,
          created  TIMESTAMPZ   NOT NULL
        );
    
        CREATE INDEX IF NOT EXISTS check_user_fkey
          ON "check" (username);
        CREATE INDEX IF NOT EXISTS change_check_fkey
          ON "change" (check_id);
        CREATE INDEX IF NOT EXISTS response_check_fkey
          ON "response" (check_id);
        CREATE INDEX IF NOT EXISTS response_created_index
          ON "response" (created);

        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        CREATE OR REPLACE FUNCTION unique_short_id()
        RETURNS TRIGGER AS $$

        DECLARE
          key TEXT;
          query TEXT;
          found TEXT;
          
        BEGIN
          query := 'SELECT id FROM ' || quote_ident(TG_TABLE_NAME) || ' WHERE id=';

          LOOP
            key := encode(gen_random_bytes(6), 'base64');
            key := replace(key, '/', '_');
            key := replace(key, '+', '-');

            EXECUTE query || quote_literal(key) INTO found;

            IF found IS NULL THEN
              EXIT;
            END IF;

          END LOOP;

          NEW.id = key;

          RETURN NEW;
        END; $$ LANGUAGE plpgsql;
        
        CREATE OR REPLACE FUNCTION delete_expired_responses()
        RETURNS TRIGGER AS $$

        BEGIN
          DELETE FROM response WHERE response.created < NOW() - INTERVAL '1 day';
          RETURN NULL;
        END; $$ LANGUAGE plpgsql;
        
        CREATE OR REPLACE FUNCTION reduce_user_credit()
        RETURNS TRIGGER AS $$

        BEGIN
          IF NEW.refresh != OLD.refresh THEN
            UPDATE "user"
              SET credit = credit - 1,
                  modified = NOW()
            WHERE username = NEW.username
              AND credit > 0;
          END IF;
          RETURN NULL;
        END; $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS check_generate_id
          ON "check";

        CREATE TRIGGER check_generate_id
          BEFORE INSERT ON "check"
          FOR EACH ROW EXECUTE PROCEDURE unique_short_id();
          
        DROP TRIGGER IF EXISTS check_reduce_user_credit
          ON "check";
          
        CREATE TRIGGER check_reduce_user_credit
          AFTER UPDATE ON "check"
          FOR EACH ROW EXECUTE PROCEDURE reduce_user_credit();  
          
        DROP TRIGGER IF EXISTS response_delete_expired_responses
          ON response;
          
        CREATE TRIGGER response_delete_expired_responses
          AFTER INSERT ON response
          FOR EACH STATEMENT
          EXECUTE PROCEDURE delete_expired_responses();
    `;
    
    client.connect(() => {
        client.query(sql, () => {
        	client.end();
            callback();
        });
    });
};
