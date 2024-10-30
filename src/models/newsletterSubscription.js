/* eslint-disable no-useless-escape */
const mongoose = require('mongoose');

const emailRegex = /^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$/;

const newsletterSubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: emailRegex,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
});

const NewsletterSubscription = mongoose.model('NewsletterSubscription', newsletterSubscriptionSchema);

module.exports = NewsletterSubscription;
