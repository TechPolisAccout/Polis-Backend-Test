const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: [true, 'Conversation id is a required field'],
  },
  messages: [
    {
      userId: {
        type: String,
        required: [true, 'User id is a required field'],
      },
      senderId: {
        type: String,
        required: [true, 'Sender id is a required field'],
      },
      listingId: {
        type: String,
      },
      text: {
        type: String,
        required: [true, 'Message text is a required field'],
      },
      pic: {
        type: String,
        required: [true, 'Listing picture is a required field'],
      },
      title: {
        type: String,
        required: [true, 'Listing title is a required field'],
      },
      name: {
        type: String,
        required: [true, 'User name is a required field'],
      },
      listingOwnerEmail: {
        type: String,
      },
      senderEmail: {
        type: String,
        required: [true, 'Sender email is a required field'],
      },
      recipientProfilePictureUrl: {
        type: String,
      },
      senderIdforRead: {
        type: String,
      },
      listingOwnerName: {
        type: String,
      },
      listingType: {
        type: String,
      },
      recipientId: {
        type: String,
        required: [true, 'recipient id  is a required field'],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
