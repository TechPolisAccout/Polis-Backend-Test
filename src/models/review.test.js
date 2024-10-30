const mongoose = require('mongoose');
const Review = require('./review');

describe('Review Schema Tests', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Validation of Required Fields', () => {
    it('should be invalid if `user` is missing', () => {
      const review = new Review({
        property: new mongoose.Types.ObjectId(),
        rating: 4,
        comment: 'Great stay!',
      });

      const error = review.validateSync();
      expect(error.errors.user).toBeDefined();
      expect(error.errors.user.message).toEqual('Path `user` is required.');
    });

    it('should be invalid if `property` is missing', () => {
      const review = new Review({
        user: new mongoose.Types.ObjectId(),
        rating: 5,
        comment: 'Wonderful place!',
      });

      const error = review.validateSync();
      expect(error.errors.property).toBeDefined();
      expect(error.errors.property.message).toEqual('Path `property` is required.');
    });

    it('should be invalid if `rating` is missing', () => {
      const review = new Review({
        user: new mongoose.Types.ObjectId(),
        property: new mongoose.Types.ObjectId(),
        comment: 'Nice experience!',
      });

      const error = review.validateSync();
      expect(error.errors.rating).toBeDefined();
      expect(error.errors.rating.message).toEqual('Path `rating` is required.');
    });
  });

  describe('Validation of `rating` Field', () => {
    it('should be invalid if `rating` is not a number', () => {
      const review = new Review({
        user: new mongoose.Types.ObjectId(),
        property: new mongoose.Types.ObjectId(),
        rating: 'five',
        comment: 'Lovely place.',
      });

      const error = review.validateSync();
      expect(error.errors.rating).toBeDefined();
      expect(error.errors.rating.message).toContain('Cast to Number failed');
    });
  });

  describe('Default Values', () => {
    it('should set the default `date` to the current date', () => {
      const review = new Review({
        user: new mongoose.Types.ObjectId(),
        property: new mongoose.Types.ObjectId(),
        rating: 5,
        comment: 'Had a fantastic time!',
      });

      expect(review.date).toBeDefined();
      const today = new Date();
      expect(review.date.toDateString()).toEqual(today.toDateString());
    });
  });

  describe('Optional Fields', () => {
    it('should be valid if `comment` is missing', () => {
      const review = new Review({
        user: new mongoose.Types.ObjectId(),
        property: new mongoose.Types.ObjectId(),
        rating: 4,
      });

      const error = review.validateSync();
      expect(error).toBeUndefined();
    });
  });
});
