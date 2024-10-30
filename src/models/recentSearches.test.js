const mongoose = require('mongoose');
const RecentSearch = require('./recentSearches');

describe('RecentSearch Schema Tests', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Validation of Required Fields', () => {
    it('should be invalid if `userId` is missing', () => {
      const recentSearch = new RecentSearch({
        searches: ['New York', 'Los Angeles'],
      });

      const error = recentSearch.validateSync();
      expect(error.errors.userId).toBeDefined();
      expect(error.errors.userId.message).toEqual('Path `userId` is required.');
    });
  });

  describe('Default Value for Searches', () => {
    it('should set `searches` to an empty array by default', () => {
      const recentSearch = new RecentSearch({
        userId: 'testUserId123',
      });

      expect(recentSearch.searches).toEqual([]);
    });
  });
});
