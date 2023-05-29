import fs from 'fs/promises';

import sqlite from 'sqlite3';
import { POLLS, USERS } from './db-seed';


const dbFile = './build/data/polls.db';
const polls = POLLS;
const users = USERS;

sqlite.verbose();

console.log('Initializing the database.');

_dropDatabase().then(() => _setupDatabase());

export function connect(): sqlite.Database {
  return new sqlite.Database(dbFile);
}

function _setupDatabase(): void {
  const db = new sqlite.Database(dbFile);

  _setupUserTable(db);
  _setupPollTable(db);

  db.close();
}

function _setupUserTable(db: sqlite.Database): void {
  db.serialize(() => {
    db.run(`CREATE TABLE user (
      id            INTEGER   PRIMARY KEY,
      username      TEXT      NOT NULL,
      name          TEXT      NOT NULL,
      password      TEXT      NOT NULL
    )`);

    const statement = db.prepare("INSERT INTO user (username, name, password) VALUES (?, ?, ?)");
    for (const user of users) {
      statement.run(user.username, user.name, user.password);
    }
    statement.finalize();
  });

}

function _setupPollTable(db: sqlite.Database): void {
  db.serialize(() => {
    db.run(`CREATE TABLE poll (
      id            INTEGER                                             PRIMARY KEY,
      name          TEXT                                                NOT NULL,
      description   TEXT                                                NOT NULL DEFAULT '',
      status        TEXT CHECK(status = 'Opened' OR status = 'Closed')  NOT NULL,
      createdBy     INTEGER                                             NOT NULL,
      options       TEXT                                                NOT NULL DEFAULT '',
      FOREIGN KEY   (createdBy) REFERENCES user(id)
    )`);

    const statement = db.prepare("INSERT INTO poll (name, description, status, createdBy, options) VALUES (?, ?, ?, ?, ?)");
    for (const poll of polls) {
      statement.run(poll.name, poll.description, poll.status, poll.createdBy, JSON.stringify(poll.options));
    }
    statement.finalize();
  });
}

function _dropDatabase(): Promise<void> {
  return fs.unlink(dbFile)
    .catch(error => Promise.resolve());
}
