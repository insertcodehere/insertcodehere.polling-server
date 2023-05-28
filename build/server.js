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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_validator_1 = require("express-validator");
const ws_1 = __importDefault(require("ws"));
const db_1 = require("./data/db");
const polls_1 = require("./data/polls");
const users_1 = require("./data/users");
const PORT = 3001;
const db = (0, db_1.connect)();
const app = (0, express_1.default)();
const jsonParser = body_parser_1.default.json();
const emitter = new events_1.EventEmitter();
// Middlewares
app.use((0, cors_1.default)());
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
app.post('/api/auth/login', jsonParser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield users_1.users.login(db, username, password);
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
}));
app.post('/api/auth/signup', jsonParser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = {
        username: req.body.username,
        name: req.body.name,
        password: req.body.password
    };
    const queryResult = yield users_1.users.create(db, user);
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
}));
app.post('/api/auth/logout', jsonParser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.sendStatus(200);
}));
app.get('/api/poll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const queryResult = yield polls_1.polls.getAll(db);
    res.send(queryResult);
}));
app.get('/api/poll/my', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rawAuthenticatedUser = req.header('Authentication');
    const authenticatedUser = JSON.parse(rawAuthenticatedUser);
    const queryResult = yield polls_1.polls.getAllByUser(db, authenticatedUser.userId);
    res.send(queryResult);
}));
app.get('/api/poll/:pollId(\\d+)', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pollId = req.params.pollId;
    const poll = yield polls_1.polls.get(db, pollId);
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
}));
app.put('/api/poll/:pollId(\\d+)/vote', jsonParser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pollId = req.params.pollId;
    const vote = req.body.votedBy;
    const optionIndex = req.body.option;
    const storedPoll = yield polls_1.polls.get(db, pollId);
    if (!storedPoll) {
        res.send({
            error: {
                code: 404,
                message: 'Poll not found'
            }
        });
        return;
    }
    const storedUser = yield users_1.users.get(db, vote);
    if (!storedUser) {
        res.send({
            error: {
                code: 404,
                message: 'User not found'
            }
        });
        return;
    }
    function hasUserVoted(userId, options) {
        return options.some((option) => option.votes.includes(userId));
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
    const updatedPoll = yield polls_1.polls.updateOptions(db, storedPoll);
    emitter.emit('poll:vote', updatedPoll);
    res.send(updatedPoll);
}));
app.get('/api/poll/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const queryString = req.query.query;
    const queryResult = yield polls_1.polls.search(db, (_a = queryString === null || queryString === void 0 ? void 0 : queryString.toString()) !== null && _a !== void 0 ? _a : '');
    res.send(queryResult);
}));
app.post('/api/poll', jsonParser, [
    (0, express_validator_1.check)('name').exists().trim().notEmpty().escape(),
    (0, express_validator_1.check)('description').notEmpty().trim().escape(),
    (0, express_validator_1.check)('status').isIn(['Opened', 'Closed'])
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = (0, express_validator_1.validationResult)(req);
    if (validation.isEmpty()) {
        const createdPoll = yield polls_1.polls.create(db, req.body);
        res.send(createdPoll);
        return;
    }
    res.send({
        error: {
            code: 400,
            message: 'Bad format'
        }
    });
}));
app.put('/api/poll/:pollId(\\d+)', jsonParser, [
    (0, express_validator_1.check)('status').isIn(['Opened', 'Closed'])
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = (0, express_validator_1.validationResult)(req);
    if (validation.isEmpty()) {
        const updatedPoll = yield polls_1.polls.changePollStatus(db, req.params.pollId, req.body.status);
        res.send(updatedPoll);
        return;
    }
    res.send({
        error: {
            code: 400,
            message: 'Bad format'
        }
    });
}));
app.delete('/api/poll/:pollId(\\d+)', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pollId = req.params.pollId;
    const queryResult = yield polls_1.polls.delete(db, pollId);
    res.send({
        code: 200
    });
}));
// HTTP server
const server = app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}.`);
});
// WebSocket server
server.on('upgrade', (req, socket, head) => {
    const wsServer = new ws_1.default.Server({
        noServer: true,
        verifyClient: (info) => {
            if (!(new RegExp('/api/ws/poll/\\d+').test(info.req.url))) {
                return false;
            }
            return true;
        }
    });
    wsServer.on('connection', (connection) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[WS] On Connection');
        const extractPollIdRegex = new RegExp('/api/ws/poll/(\\d+)');
        const pollId = req.url.match(extractPollIdRegex)[1];
        const handler = function (poll) {
            if (poll.id == pollId) {
                connection.send(JSON.stringify(poll));
            }
        };
        emitter.on('poll:vote', handler);
        connection.on('close', () => {
            emitter.off('poll:vote', handler);
            console.log('[WS] On closing');
        });
    }));
    wsServer.handleUpgrade(req, socket, head, (socket) => __awaiter(void 0, void 0, void 0, function* () {
        wsServer.emit('connection', socket, req);
    }));
});
