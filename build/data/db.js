"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const db_seed_1 = require("./db-seed");
const dbFile = __dirname + './polls.db';
const polls = db_seed_1.POLLS;
const users = db_seed_1.USERS;
sqlite3_1.default.verbose();
console.log('Initializing the database.');
_dropDatabase().then(() => _setupDatabase());
function connect() {
    return new sqlite3_1.default.Database(dbFile);
}
exports.connect = connect;
function _setupDatabase() {
    const db = new sqlite3_1.default.Database(dbFile);
    _setupUserTable(db);
    _setupPollTable(db);
    db.close();
}
function _setupUserTable(db) {
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
function _setupPollTable(db) {
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
function _dropDatabase() {
    return promises_1.default.unlink(dbFile)
        .catch(error => Promise.resolve());
}
