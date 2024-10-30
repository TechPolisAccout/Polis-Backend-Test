const ShortletProperty = require('./shortlet');

jest.mock('./shortlet', () => {
  const mockShortletProperty = {
    save: jest.fn().mockResolvedValue(true),
    reviews: [],
    calculateRatings: jest.fn(async function () {
      const reviews = this.reviews || [];
      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

      this.totalReviews = totalReviews;
      this.averageRating = parseFloat(averageRating.toFixed(1));
      await this.save();
    }),
  };

  return jest.fn(() => mockShortletProperty);
});

describe('ShortletPropertySchema', () => {
  let shortletProperty;

  beforeEach(() => {
    shortletProperty = new ShortletProperty({
      reviews: [
        { user: 'userId1', rating: 4, comment: 'Great place!' },
        { user: 'userId2', rating: 5, comment: 'Loved it!' },
      ],
    });

    shortletProperty.reviews = shortletProperty.reviews || [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('calculateRatings should handle no reviews', async () => {
    shortletProperty.reviews = [];

    await shortletProperty.calculateRatings();

    expect(shortletProperty.totalReviews).toBe(0);
    expect(shortletProperty.averageRating).toBe(0);
    expect(shortletProperty.save).toHaveBeenCalled();
  });
});
