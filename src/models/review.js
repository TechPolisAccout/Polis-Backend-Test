const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'ShortletProperty',
  },
  rating: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  comment: {
    type: String,
  },
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
