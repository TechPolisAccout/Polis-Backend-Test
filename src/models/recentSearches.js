const mongoose = require('mongoose');

const RecentSearchSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  searches: {
    type: [String],
    default: [],
  },
});

const RecentSearch = mongoose.model('RecentSearch', RecentSearchSchema);

module.exports = RecentSearch;
