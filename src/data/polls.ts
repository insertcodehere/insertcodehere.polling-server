type Poll = any;

function getAll(db: any): Promise<Poll[]> {
  return new Promise(resolve => {
    db.all("SELECT * FROM poll;", (err: any, rows: any) => {
      const normalizedRows = rows ?? [];

      const polls = normalizedRows.map((row: any) => ({
        ...row,
        id: row.id.toString(),
        options: JSON.parse(row.options)
      }));
      resolve(polls);
    });
  });
}

function getAllByUser(db: any, userId: string): Promise<Poll[]> {
  return new Promise(resolve => {
    db.all(`SELECT * FROM poll WHERE createdBy = ${+userId};`, (err: any, rows: any) => {
      const normalizedRows = rows ?? [];

      const polls = normalizedRows.map((row: any) => ({
        ...row,
        id: row.id.toString(),
        options: JSON.parse(row.options)
      }));
      resolve(polls);
    });
  });
}

function get(db: any, pollId: string): Promise<Poll> {
  return new Promise(resolve => {
    db.get(`SELECT * FROM poll WHERE id = ${+pollId};`, (err: any, row: any) => {
      const poll = {
        ...row,
        id: row.id.toString(),
        options: JSON.parse(row.options)
      };
      resolve(poll);
    });
  });
}

function search(db: any, query: string): Promise<Poll[]> {
  return new Promise(resolve => {
    db.all(`SELECT * FROM poll WHERE name LIKE '%${query}%' OR description LIKE '%${query}%';`, (err: any, rows: any) => {
      const polls = rows.map((row: any) => ({
        ...row,
        id: row.id.toString(),
        options: JSON.parse(row.options)
      }));
      resolve(polls);
    });
  });
}

function create(db: any, poll: Poll): Promise<Poll> {
  return new Promise(resolve => {
    const statement = db.prepare('INSERT INTO poll (name, description, status, createdBy, options) VALUES (?, ?, ?, ?, ?)');
    statement.run(poll.name, poll.description, poll.status, poll.createdBy, JSON.stringify(poll.options), function (this: any, error: any) {
      db.get(`SELECT * FROM poll WHERE id = ${this.lastID};`, function (err: any, result: any) {
        resolve(result);
      });

      statement.finalize();
    });
  });
}

function changePollStatus(db: any, pollId: string, pollStatus: string): Promise<Poll> {
  return new Promise(resolve => {
    const statement = db.prepare('UPDATE poll SET status = ? WHERE id = ?');
    statement.run(pollStatus, pollId, function (this: any, error: any) {
      db.get(`SELECT * FROM poll WHERE id = ${+pollId};`, function (err: any, result: any) {
        resolve(result);
      });

      statement.finalize();
    });
  });
}

function updateOptions(db: any, poll: any): Promise<Poll> {
  return new Promise(resolve => {
    const statement = db.prepare('UPDATE poll SET options = ? WHERE id = ?');
    statement.run(JSON.stringify(poll.options), +poll.id, async function (this: any, error: any) {
      const newPoll = await get(db, poll.id.toString());
      resolve(newPoll);
      statement.finalize();
    });
  });
}

function _delete(db: any, id: string): Promise<void> {
  return new Promise(resolve => {
    db.all(`DELETE FROM poll WHERE id = ${+id};`, (err: any, deleteCount: number) => {
      resolve();
    });
  });
}

export const polls = {
  getAll,
  getAllByUser,
  get,
  search,
  create,
  changePollStatus,
  updateOptions,
  delete: _delete
}
