"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const crypto_1 = require("./crypto");
function get(db, userId) {
    return new Promise(resolve => {
        db.get(`SELECT id, username, name FROM user WHERE id = ${+userId};`, (err, row) => {
            if (err) {
                console.log('users.get', err, row);
            }
            resolve(Object.assign(Object.assign({}, row), { id: row.id.toString() }));
        });
    });
}
function create(db, user) {
    const cypher = crypto_1.security.encrypt(user.password);
    return new Promise(resolve => {
        db.get(`SELECT * FROM user WHERE username = '${user.username}';`, function (err, existingUser) {
            if (existingUser) {
                resolve(null);
                return;
            }
            const statement = db.prepare('INSERT INTO user (username, name, password) VALUES (?, ?, ?)');
            statement.run(user.username, user.name, cypher, function (error) {
                db.get(`SELECT * FROM user WHERE id = '${this.lastID}';`, function (err, result) {
                    resolve(result);
                });
                statement.finalize();
            });
        });
    });
}
function login(db, username, password) {
    const cypher = crypto_1.security.encrypt(password);
    return new Promise(resolve => {
        db.get(`SELECT id, username, name FROM user WHERE username = '${username}' AND password = '${cypher}';`, (err, row) => {
            if (err) {
                resolve(null);
                return;
            }
            if (!row) {
                resolve(null);
                return;
            }
            resolve(Object.assign(Object.assign({}, row), { id: row.id.toString() }));
        });
    });
}
exports.users = {
    get,
    create,
    login
};
