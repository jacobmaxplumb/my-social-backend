require('dotenv').config();
// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const path = require('path');
const { URL } = require('url');

const getSharedDirectories = () => ({
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds'),
  },
});

const createPgConnection = () => {
  const parseConnectionString = (connectionString) => {
    const url = new URL(connectionString);
    const connection = {
      host: url.hostname,
      port: url.port ? Number(url.port) : undefined,
      database: url.pathname ? url.pathname.replace(/^\//, '') : undefined,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };

    const sslMode = (url.searchParams.get('sslmode') || '').toLowerCase();
    if (['require', 'verify-ca', 'verify-full'].includes(sslMode)) {
      connection.ssl = { rejectUnauthorized: false };
    }

    return connection;
  };

  const buildConnectionFromEnv = () => {
    const connection = {
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    };

    const sslMode = (process.env.PGSSLMODE || '').toLowerCase();
    if (['require', 'verify-ca', 'verify-full'].includes(sslMode)) {
      connection.ssl = { rejectUnauthorized: false };
    }

    return connection;
  };

  return process.env.DATABASE_URL
    ? parseConnectionString(process.env.DATABASE_URL)
    : buildConnectionFromEnv();
};

const createPgConfig = () => ({
  client: 'postgresql',
  connection: createPgConnection(),
  pool: {
    min: 2,
    max: 10,
  },
  ...getSharedDirectories(),
});

module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'dev.sqlite3'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
    },
    pool: {
      afterCreate: (conn, done) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
  },

  staging: {
    ...createPgConfig(),
  },

  production: {
    ...createPgConfig(),
  }

};
