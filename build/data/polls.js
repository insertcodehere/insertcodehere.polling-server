"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.polls = void 0;
function getAll(db) {
    return new Promise(resolve => {
        db.all("SELECT * FROM poll;", (err, rows) => {
            const normalizedRows = rows !== null && rows !== void 0 ? rows : [];
            const polls = normalizedRows.map((row) => (Object.assign(Object.assign({}, row), { id: row.id.toString(), options: JSON.parse(row.options) })));
            resolve(polls);
        });
    });
}
function getAllByUser(db, userId) {
    return new Promise(resolve => {
        db.all(`SELECT * FROM poll WHERE createdBy = ${+userId};`, (err, rows) => {
            const normalizedRows = rows !== null && rows !== void 0 ? rows : [];
            const polls = normalizedRows.map((row) => (Object.assign(Object.assign({}, row), { id: row.id.toString(), options: JSON.parse(row.options) })));
            resolve(polls);
        });
    });
}
function get(db, pollId) {
    return new Promise(resolve => {
        db.get(`SELECT * FROM poll WHERE id = ${+pollId};`, (err, row) => {
            const poll = Object.assign(Object.assign({}, row), { id: row.id.toString(), options: JSON.parse(row.options) });
            resolve(poll);
        });
    });
}
function search(db, query) {
    return new Promise(resolve => {
        db.all(`SELECT * FROM poll WHERE name LIKE '%${query}%' OR description LIKE '%${query}%';`, (err, rows) => {
            const polls = rows.map((row) => (Object.assign(Object.assign({}, row), { id: row.id.toString(), options: JSON.parse(row.options) })));
            resolve(polls);
        });
    });
}
function create(db, poll) {
    return new Promise(resolve => {
        const statement = db.prepare('INSERT INTO poll (name, description, status, createdBy, options) VALUES (?, ?, ?, ?, ?)');
        statement.run(poll.name, poll.description, poll.status, poll.createdBy, JSON.stringify(poll.options), function (error) {
            db.get(`SELECT * FROM poll WHERE id = ${this.lastID};`, function (err, result) {
                resolve(result);
            });
            statement.finalize();
        });
    });
}
function changePollStatus(db, pollId, pollStatus) {
    return new Promise(resolve => {
        const statement = db.prepare('UPDATE poll SET status = ? WHERE id = ?');
        statement.run(pollStatus, pollId, function (error) {
            db.get(`SELECT * FROM poll WHERE id = ${+pollId};`, function (err, result) {
                resolve(result);
            });
            statement.finalize();
        });
    });
}
function updateOptions(db, poll) {
    return new Promise(resolve => {
        const statement = db.prepare('UPDATE poll SET options = ? WHERE id = ?');
        statement.run(JSON.stringify(poll.options), +poll.id, function (error) {
            return __awaiter(this, void 0, void 0, function* () {
                const newPoll = yield get(db, poll.id.toString());
                resolve(newPoll);
                statement.finalize();
            });
        });
    });
}
function _delete(db, id) {
    return new Promise(resolve => {
        db.all(`DELETE FROM poll WHERE id = ${+id};`, (err, deleteCount) => {
            resolve();
        });
    });
}
exports.polls = {
    getAll,
    getAllByUser,
    get,
    search,
    create,
    changePollStatus,
    updateOptions,
    delete: _delete
};
