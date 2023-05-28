import { EventEmitter } from 'events';

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { check, validationResult } from 'express-validator';

import ws from 'ws';

import { connect } from './data/db';

import { polls } from './data/polls';
import { users } from './data/users';

const PORT = 3001;
const db = connect();
const app = express();
const jsonParser = bodyParser.json()

const emitter = new EventEmitter();

// Middlewares
app.use(cors());
app.use((req, res, next) => {
  if (req.url.startsWith('/api/auth/')) {
    next();
    return;
  }

  if (!req.header('Authentication')) {
    res.sendStatus(401);
    return;
  }

  next();
});

// Routes
app.post('/api/auth/login', jsonParser, async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await users.login(db, username, password);

  if (!user) {
    res.status(404);
    res.send({
      error: {
        code: 404,
        message: 'Incorrect username or password.'
      }
    });
    return;
  }

  res.send(user);
});

app.post('/api/auth/signup', jsonParser, async (req: Request, res: Response) => {
  const user = {
    username: req.body.username,
    name: req.body.name,
    password: req.body.password
  };
  const queryResult = await users.create(db, user);

  if (!queryResult) {
    res.status(400);
    res.send({
      error: {
        code: 400,
        message: 'Username already taken.'
      }
    });
    return;
  }

  res.send(queryResult);
});

app.post('/api/auth/logout', jsonParser, async (req: Request, res: Response) => {
  res.sendStatus(200);
})

app.get('/api/poll', async (req: Request, res: Response) => {
  const queryResult = await polls.getAll(db);
  res.send(queryResult);
});

app.get('/api/poll/my', async (req: Request, res: Response) => {
  const rawAuthenticatedUser = req.header('Authentication') as string;
  const authenticatedUser = JSON.parse(rawAuthenticatedUser);
  const queryResult = await polls.getAllByUser(db, authenticatedUser.userId);
  res.send(queryResult);
});

app.get('/api/poll/:pollId(\\d+)', async (req: Request, res: Response) => {
  const pollId: string = req.params.pollId;
  const poll: any = await polls.get(db, pollId);

  if (!poll) {
    res.send({
      error: {
        code: 404,
        message: 'Poll not found'
      }
    });
    return;
  }

  res.send(poll);
});

app.put('/api/poll/:pollId(\\d+)/vote', jsonParser, async (req: Request, res: Response) => {
  const pollId: string = req.params.pollId;
  const vote = req.body.votedBy;
  const optionIndex = req.body.option;
  const storedPoll = await polls.get(db, pollId);

  if (!storedPoll) {
    res.send({
      error: {
        code: 404,
        message: 'Poll not found'
      }
    });
    return;
  }

  const storedUser = await users.get(db, vote);

  if (!storedUser) {
    res.send({
      error: {
        code: 404,
        message: 'User not found'
      }
    });
    return;
  }

  function hasUserVoted(userId: any, options: any): boolean {
    return options.some((option: any) => option.votes.includes(userId));
  }

  const options = storedPoll.options;
  const alreadyVoted = hasUserVoted(vote, options);
  if (alreadyVoted) {
    res.send({
      error: {
        code: 404,
        message: `User with '${vote}' already voted.`
      }
    });
    return;
  }
  const option = storedPoll.options[optionIndex];
  option.votes.push(vote);

  const updatedPoll: any = await polls.updateOptions(db, storedPoll);

  emitter.emit('poll:vote', updatedPoll);

  res.send(updatedPoll);
});

app.get('/api/poll/search', async (req: Request, res: Response) => {
  const queryString = req.query.query;
  const queryResult = await polls.search(db, queryString?.toString() ?? '');
  res.send(queryResult);
});

app.post(
  '/api/poll',
  jsonParser,
  [
    check('name').exists().trim().notEmpty().escape(),
    check('description').notEmpty().trim().escape(),
    check('status').isIn(['Opened', 'Closed'])
  ],
  async (req: Request, res: Response) => {
    const validation = validationResult(req);
    if (validation.isEmpty()) {
      const createdPoll = await polls.create(db, req.body);
      res.send(createdPoll);
      return;
    }

    res.send({
      error: {
        code: 400,
        message: 'Bad format'
      }
    });
  }
);

app.put(
  '/api/poll/:pollId(\\d+)',
  jsonParser,
  [
    check('status').isIn(['Opened', 'Closed'])
  ],
  async (req: Request, res: Response) => {
    const validation = validationResult(req);
    if (validation.isEmpty()) {
      const updatedPoll = await polls.changePollStatus(db, req.params.pollId, req.body.status);
      res.send(updatedPoll);
      return;
    }

    res.send({
      error: {
        code: 400,
        message: 'Bad format'
      }
    });
  });

app.delete('/api/poll/:pollId(\\d+)', async (req: Request, res: Response) => {
  const pollId = req.params.pollId
  const queryResult = await polls.delete(db, pollId);
  res.send({
    code: 200
  });
});

// HTTP server
const server = app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}.`);
});

// WebSocket server
server.on('upgrade', (req: Request, socket, head: Buffer) => {
  const wsServer = new ws.Server({
    noServer: true,
    verifyClient: (info: any) => {
      if (!(new RegExp('/api/ws/poll/\\d+').test(info.req.url))) {
        return false;
      }
      return true;
    }
  });

  wsServer.on('connection', async connection => {
    console.log('[WS] On Connection');
    const extractPollIdRegex = new RegExp('/api/ws/poll/(\\d+)');
    const pollId = req.url.match(extractPollIdRegex)![1];

    const handler = function (poll: any) {
      if (poll.id == pollId) {
        connection.send(JSON.stringify(poll));
      }
    };

    emitter.on('poll:vote', handler);

    connection.on('close', () => {
      emitter.off('poll:vote', handler);
      console.log('[WS] On closing');
    });
  });

  wsServer.handleUpgrade(req, socket, head, async (socket) => {
    wsServer.emit('connection', socket, req);
  });
});
