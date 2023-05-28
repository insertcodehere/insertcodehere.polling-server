"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
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
    return new Promise(resolve => {
        db.get(`SELECT * FROM user WHERE username = '${user.username}';`, function (err, existingUser) {
            if (existingUser) {
                resolve(null);
                return;
            }
            const statement = db.prepare('INSERT INTO user (username, name, password) VALUES (?, ?, ?)');
            statement.run(user.username, user.name, user.password, function (error) {
                db.get(`SELECT * FROM user WHERE id = '${this.lastID}';`, function (err, result) {
                    resolve(result);
                });
                statement.finalize();
            });
        });
    });
}
function login(db, username, password) {
    return new Promise(resolve => {
        db.get(`SELECT id, username, name FROM user WHERE username = '${username}' AND password = '${password}';`, (err, row) => {
            if (err) {
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
