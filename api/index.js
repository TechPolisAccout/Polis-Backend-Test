const express = require('express');
require('dotenv').config();
const schema = require('../src/schema/schema');
const connectDB = require('../config/db');
const bodyParser = require('body-parser');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const Property = require('../src/models/property');
const jwt = require('jsonwebtoken');
const User = require('../src/models/user');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('../src/models/message');
const paymentRoute = require('../src/routes/paymentRoute');
const logger = require('pino')();

connectDB();

const app = express();

app.use('../public', express.static('public'));
app.use(bodyParser.json());
app.use(cors());

const authMiddleware = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    return null;
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    // credentials: true,
  },
});

app.use(
  '/graphql',
  graphqlHTTP(async (req, res) => {
    const user = await authMiddleware(req, res);
    console.log({ user });
    return {
      schema,
      graphiql: true,
      context: {
        User,
        Property,
        currentUser: user,
        io,
      },
    };
  }),
);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/payment', paymentRoute);

io.on('connection', (socket) => {
  socket.on('join', ({ listingId, senderId, recipientId }) => {
    let conversationId;

    if (listingId) {
      // This is a listing-based message
      conversationId = `${listingId}-${senderId}-${recipientId}`;
    } else {
      // This is a direct message (admin to user)
      conversationId = `${senderId}-${recipientId}`;
    }

    socket.join(conversationId);
  });

  socket.on('joinNotifications', ({ userId }) => {
    socket.join(userId);
  });

  // Listen for general notifications
  socket.on('notifyUser', (data) => {
    const { userId, title, body } = data;
    io.to(userId).emit('notification', {
      title,
      body,
      timestamp: new Date(),
      read: false,
    });
  });

  socket.on('message', async (data) => {
    const {
      userId,
      senderId,
      recipientId,
      recipientProfilePictureUrl,
      listingId,
      text,
      senderIdforRead,
      pic,
      name,
      title,
      listingOwnerEmail,
      listingOwnerName,
      senderEmail,
      listingType,
      createdAt,
    } = data;
    let conversationId;

    if (listingId) {
      conversationId = `${listingId}-${senderId}-${recipientId}`;
    } else {
      conversationId = `${senderId}-${recipientId}`;
    }

    try {
      let messageDoc = await Message.findOne({ conversationId });
      if (!messageDoc) {
        messageDoc = new Message({ conversationId });
      }

      messageDoc.messages.push({
        userId,
        senderId,
        senderEmail,
        senderIdforRead,
        text,
        listingId,
        recipientId,
        name,
        title,
        pic,
        listingOwnerEmail,
        recipientProfilePictureUrl,
        listingOwnerName,
        listingType,
        createdAt,
      });
      await messageDoc.save();

      io.to(conversationId).emit('message', {
        conversationId,
        userId,
        senderId,
        text,
        listingId,
        pic,
        recipientId,
        senderIdforRead,
        name,
        title,
        listingOwnerEmail,
        listingOwnerName,
        recipientProfilePictureUrl,
        senderEmail,
        listingType,
        createdAt,
      });
    } catch (error) {
      console.error('Error saving message:', error.message);
    }
  });
});

const port = process.env.PORT || 5000;

if (!module.parent) {
  server.listen(port, () => {
    logger.info(`server running on port ${port}`);
  });
}

module.exports = server;
