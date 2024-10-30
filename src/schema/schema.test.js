const { graphql } = require('graphql');
const mongoose = require('mongoose');
const schema = require('../schema/schema');
const Property = require('../models/property');
const ShortletProperty = require('../models/shortlet');
const User = require('../models/user');
// const RecentSearch = require('../models/recentSearches');
const Review = require('../models/review');
const Booking = require('../models/booking');

jest.mock('../models/property');
jest.mock('../models/shortlet');
jest.mock('../models/user');

describe('allProperties Query', () => {
  it('should return a list of properties with a cursor for pagination', async () => {
    const mockProperties = [
      { _id: 'property1', id: 'property1', address: '123 Main St' },
      { _id: 'property2', id: 'property2', address: '456 Elm St' },
    ];

    const limitMock = jest.fn().mockResolvedValue(mockProperties);
    Property.find.mockReturnValue({ limit: limitMock });

    const query = `
      query {
        allProperties(limit: 2) {
          property {
            id
            address
          }
          cursor
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.allProperties).toHaveLength(2);
    expect(response.data.allProperties[0].property.address).toBe('123 Main St');
    expect(response.data.allProperties[1].property.address).toBe('456 Elm St');
    expect(response.data.allProperties[0].cursor).toBe('property1');
    expect(response.data.allProperties[1].cursor).toBe('property2');

    expect(Property.find).toHaveBeenCalledWith({});
    expect(Property.find).toHaveBeenCalledTimes(1);
    expect(limitMock).toHaveBeenCalledWith(2);
  });
});

describe('properties Query', () => {
  it('should return a list of properties based on arguments with pagination', async () => {
    const mockProperties = [
      { _id: 'property1', address: '123 Main St', listingType: 'rent' },
      { _id: 'property2', address: '456 Elm St', listingType: 'rent' },
    ];
    const limitMock = jest.fn().mockResolvedValue(mockProperties);
    Property.find.mockReturnValue({ limit: limitMock });

    const query = `
      query {
        properties(cursor: null, limit: 2, listingType: RENT, address: "456 Elm St") {
          properties {
            property {
              address
            }
            cursor
          }
          hasMore
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.properties.properties).toHaveLength(2);
    expect(response.data.properties.hasMore).toBe(false);
    expect(Property.find).toHaveBeenCalledWith({ listingType: 'rent', address: '456 Elm St' });
    expect(limitMock).toHaveBeenCalledWith(3);
  });
});

describe('shortletProperties Query', () => {
  it('should return a list of shortlet properties based on arguments with pagination', async () => {
    const mockShortletProperties = [
      { _id: 'shortlet1', address: '789 Oak St', listingType: 'shortlet' },
      { _id: 'shortlet2', address: '101 Pine St', listingType: 'shortlet' },
    ];
    const limitMock = jest.fn().mockResolvedValue(mockShortletProperties);
    ShortletProperty.find.mockReturnValue({ limit: limitMock });

    const query = `
      query {
        shortletProperties(cursor: null, limit: 2, listingType: SHORTLET, address: "101 Pine St") {
          properties {
            property {
              address
            }
            cursor
          }
          hasMore
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.shortletProperties.properties).toHaveLength(2);
    expect(response.data.shortletProperties.hasMore).toBe(false);
    expect(ShortletProperty.find).toHaveBeenCalledWith({ listingType: 'shortlet', address: '101 Pine St' });
    expect(limitMock).toHaveBeenCalledWith(3);
  });
});

describe('property Query', () => {
  it('should return a single property by ID', async () => {
    const mockProperty = { _id: 'property1', address: '123 Main St', listingType: 'rent' };
    Property.findById.mockResolvedValue(mockProperty);

    const query = `
      query {
        property(id: "property1") {
          address
          listingType
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.property.address).toBe('123 Main St');
    expect(Property.findById).toHaveBeenCalledWith('property1');
  });

  it('should throw an error if property ID not found', async () => {
    Property.findById.mockResolvedValue(null);

    const query = `
      query {
        property(id: "nonexistent") {
          address
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe('Property with ID nonexistent not found.');
  });
});

describe('propertiesByUser Query', () => {
  it('should return properties associated with a user by userId', async () => {
    const mockUser = { _id: 'user1' };
    const mockProperties = [
      { _id: 'property1', address: '123 Main St', user: 'user1' },
      { _id: 'property2', address: '456 Elm St', user: 'user1' },
    ];
    const limitMock = jest.fn().mockResolvedValue(mockProperties);

    User.findById.mockResolvedValue(mockUser);
    Property.find.mockReturnValue({ limit: limitMock });

    const query = `
      query {
        propertiesByUser(userId: "user1", cursor: null, limit: 2) {
          properties {
            property {
              address
            }
            cursor
          }
          hasMore
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.propertiesByUser.properties).toHaveLength(2);
    expect(User.findById).toHaveBeenCalledWith('user1');
    expect(Property.find).toHaveBeenCalledWith({ user: 'user1' });
    expect(limitMock).toHaveBeenCalledWith(3);
  });

  it('should throw an error if user is not found', async () => {
    User.findById.mockResolvedValue(null);

    const query = `
      query {
        propertiesByUser(userId: "nonexistent", cursor: null, limit: 2) {
          properties {
            property {
              address
            }
          }
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe('User not found.');
  });
});

describe('userShortletProperties Query', () => {
  it('should return shortlet properties associated with a user by userId', async () => {
    const mockUser = { _id: 'user1' };
    const mockProperties = [
      { _id: 'shortlet1', listingType: 'shortlet', address: '123 Main St' },
      { _id: 'shortlet2', listingType: 'shortlet', address: '456 Elm St' },
    ];
    const limitMock = jest.fn().mockResolvedValue(mockProperties);

    User.findById.mockResolvedValue(mockUser);
    ShortletProperty.find.mockReturnValue({ limit: limitMock });

    const query = `
      query {
        userShortletProperties(userId: "user1", cursor: null, limit: 2) {
          properties {
            property {
              address
              listingType
            }
            cursor
          }
          hasMore
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.userShortletProperties.properties).toHaveLength(2);
    expect(User.findById).toHaveBeenCalledWith('user1');
    expect(ShortletProperty.find).toHaveBeenCalledWith({ user: 'user1' });
    expect(limitMock).toHaveBeenCalledWith(3);
  });

  it('should throw an error if user is not found', async () => {
    User.findById.mockResolvedValue(null);

    const query = `
      query {
        userShortletProperties(userId: "nonexistent", cursor: null, limit: 2) {
          properties {
            property {
              address
            }
          }
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe('User not found.');
  });
});

describe('user Query', () => {
  it('should return user details for a valid user ID', async () => {
    const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' };

    User.findById.mockResolvedValue(mockUser);

    const query = `
      query {
        user(id: "user1") {
          id
          name
          email
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.user).toBeDefined();
    expect(response.data.user.id).toEqual('user1');
    expect(User.findById).toHaveBeenCalledWith('user1');
  });

  it('should throw an error if user does not exist', async () => {
    User.findById.mockResolvedValue(null);

    const query = `
      query {
        user(id: "nonexistent") {
          id
          name
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe('User not found.');
  });
});

describe('wishlistByUser Query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of properties in the wishlist for a user', async () => {
    const mockProperty = { _id: 'property1', listingType: 'rent', id: 'property1' };
    const mockUser = {
      _id: 'user1',
      wishlist: [{ property: mockProperty, dateAdded: new Date(), _id: 'item1' }],
      populate: jest
        .fn()
        .mockResolvedValue({ wishlist: [{ property: mockProperty, dateAdded: new Date(), _id: 'item1' }] }),
    };

    User.findById.mockResolvedValue(mockUser);

    const query = `
      query {
        wishlistByUser(userId: "user1", wishlistLimit: 2) {
          wishlist {
            property {
              id
              listingType
            }
            cursor
          }
          hasMore
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.wishlistByUser.wishlist).toHaveLength(1);
    expect(response.data.wishlistByUser.wishlist[0].property.id).toBe('property1');
    expect(User.findById).toHaveBeenCalledWith('user1');
  });

  it('should throw an error if user does not exist', async () => {
    User.findById.mockResolvedValue(null);

    const query = `
      query {
        wishlistByUser(userId: "nonexistent", wishlistLimit: 2) {
          wishlist {
            property {
              id
            }
          }
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe('User not found.');
  });
});

describe('shortletWishlistByUser Query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of shortlet properties in the wishlist for a user', async () => {
    const mockShortlet = { _id: 'shortlet1', listingType: 'shortlet', id: 'shortlet1' };
    const mockUser = {
      id: 'user1',
      shortletWishlist: [{ shortlet: mockShortlet, dateAdded: new Date(), _id: 'item1' }],
    };

    User.findById = jest.fn(() => ({
      populate: jest.fn().mockResolvedValue(mockUser),
    }));

    const query = `
      query {
        shortletWishlistByUser(userId: "user1", wishlistLimit: 2) {
          shortletWishlist {
            property {
              id
              listingType
            }
            cursor
          }
          hasMore
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.shortletWishlistByUser.shortletWishlist).toHaveLength(1);
    expect(response.data.shortletWishlistByUser.shortletWishlist[0].property.id).toBe('shortlet1');
    expect(User.findById).toHaveBeenCalledWith('user1');
  });

  it('should throw an error if user does not exist', async () => {
    User.findById = jest.fn(() => ({
      populate: jest.fn().mockResolvedValue(null),
    }));

    const query = `
      query {
        shortletWishlistByUser(userId: "nonexistent", wishlistLimit: 2) {
          shortletWishlist {
            property {
              id
            }
          }
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe('User not found.');
  });
});

describe('propertyReviews Query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return reviews and hasMore for a valid property ID', async () => {
    const mockReviews = [
      { _id: 'review1', rating: 5, user: 'user1' },
      { _id: 'review2', rating: 4, user: 'user2' },
    ];

    Review.find = jest.fn().mockReturnThis();
    Review.populate = jest.fn().mockReturnThis();
    Review.limit = jest.fn().mockResolvedValue(mockReviews);

    const query = `
      query {
        propertyReviews(propertyId: "propertyId", cursor: null, limit: 2) {
          reviews {
            review {
              rating
            }
            cursor
          }
          hasMore
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.propertyReviews.reviews).toHaveLength(2);
    expect(response.data.propertyReviews.hasMore).toBe(false); // Adjust based on your mock logic
  });

  it('should return empty reviews if no reviews are found', async () => {
    Review.find = jest.fn().mockReturnThis();
    Review.populate = jest.fn().mockReturnThis();
    Review.limit = jest.fn().mockResolvedValue([]);

    const query = `
      query {
        propertyReviews(propertyId: "propertyId", cursor: null, limit: 2) {
          reviews {
            review {
              date
              user{
                id
              }
            }
          }
          hasMore
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.propertyReviews.reviews).toHaveLength(0);
    expect(response.data.propertyReviews.hasMore).toBe(false);
  });
});

describe('propertyRating Query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return average rating and total reviews for a valid property ID', async () => {
    const mockPropertyId = new mongoose.Types.ObjectId(); // Generate a valid ObjectId
    const mockAggregateResponse = [{ _id: mockPropertyId, averageRating: 4.5, totalReviews: 10 }];

    ShortletProperty.aggregate = jest.fn().mockResolvedValue(mockAggregateResponse);

    const query = `
      query {
        propertyRating(propertyId: "${mockPropertyId}") {
          averageRating
          totalReviews
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined(); // Check for undefined errors
    expect(response.data.propertyRating.averageRating).toBe(4.5);
    expect(response.data.propertyRating.totalReviews).toBe(10);
  });

  it('should handle cases where no ratings are found', async () => {
    const mockPropertyId = new mongoose.Types.ObjectId(); // Generate a valid ObjectId
    ShortletProperty.aggregate = jest.fn().mockResolvedValue([]);

    const query = `
      query {
        propertyRating(propertyId: "${mockPropertyId}") {
          averageRating
          totalReviews
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.propertyRating).toBeDefined();
    expect(response.data.propertyRating.averageRating).toBeNull();
    expect(response.data.propertyRating.totalReviews).toBe(0);
  });
});

describe('shortLetProperty Query', () => {
  it('should return a property for a valid ID', async () => {
    const mockPropertyId = new mongoose.Types.ObjectId();
    const mockProperty = { id: mockPropertyId, title: 'Sample Property' };

    ShortletProperty.findById = jest.fn().mockResolvedValue(mockProperty);

    const query = `
      query {
        shortLetProperty(id: "${mockPropertyId}") {
          id
          title
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.shortLetProperty).toBeDefined();
    expect(response.data.shortLetProperty.title).toBe(mockProperty.title);
  });

  it('should throw an error for an invalid ID', async () => {
    const mockPropertyId = new mongoose.Types.ObjectId();

    ShortletProperty.findById = jest.fn().mockResolvedValue(null);

    const query = `
      query {
        shortLetProperty(id: "${mockPropertyId}") {
          id
          title
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: {},
    });

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe(`Property with ID ${mockPropertyId} not found.`);
  });
});

describe('booking Query', () => {
  it('should return booking details for valid booking and property IDs', async () => {
    const mockBookingId = 'mockBookingId123';
    const mockPropertyId = '650f5f997b27f69fa86414b1';
    const mockUserId = '6509f873463653fc0e363a4b';

    const mockBooking = {
      _id: mockBookingId,
      id: mockBookingId,
      property: mockPropertyId,
      user: mockUserId,
      payment: { status: 'Pending' },
    };

    console.log({ mockBooking });

    Booking.findOne = jest.fn().mockResolvedValue(mockBooking);

    const mockUser = {
      _id: mockUserId,
      id: mockUserId,
    };
    User.findById = jest.fn().mockResolvedValue(mockUser);

    const mockProperty = {
      _id: mockPropertyId,
      id: mockPropertyId.toString(),
    };

    Property.findById = jest.fn().mockResolvedValue(mockProperty);

    const propertyResponse = await Property.findById(mockPropertyId);
    console.log(propertyResponse);

    const context = { currentUser: { id: mockUserId.toString() } };

    const query = `
      query {
        booking(bookingId: "${mockBookingId}", propertyId: "${mockPropertyId}") {
          id
          property
          user {
            id
          }
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: context,
    });

    expect(response.errors).toBeUndefined();
    expect(response.data.booking).toBeDefined();
    expect(response.data.booking.id).toBe(mockBookingId.toString());
    expect(response.data.booking.user.id).toBe(mockUserId.toString());
    expect(response.data.booking.property.id).toBe(mockPropertyId.toString());
  });

  it('should throw an error for unauthorized access', async () => {
    const mockBookingId = new mongoose.Types.ObjectId();
    const mockPropertyId = new mongoose.Types.ObjectId();
    const mockUserId = new mongoose.Types.ObjectId();

    const mockBooking = {
      _id: mockBookingId,
      property: mockPropertyId,
      user: mockUserId,
      payment: { status: 'Pending' },
    };

    Booking.findOne = jest.fn().mockResolvedValue(mockBooking);

    const mockUser = {
      _id: mockUserId,
    };
    User.findById = jest.fn().mockResolvedValue(mockUser);

    const context = { currentUser: { id: new mongoose.Types.ObjectId() } };

    const query = `
      query {
        booking(bookingId: "${mockBookingId}", propertyId: "${mockPropertyId}") {
          id
          property 
          user {
            id
          }
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: context,
    });

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe('unauthorized');
  });

  it('should throw an error if payment status is completed', async () => {
    const mockBookingId = new mongoose.Types.ObjectId();
    const mockPropertyId = new mongoose.Types.ObjectId();
    const mockUserId = new mongoose.Types.ObjectId();

    const mockBooking = {
      _id: mockBookingId,
      property: mockPropertyId,
      user: mockUserId,
      payment: { status: 'Completed' },
    };

    Booking.findOne = jest.fn().mockResolvedValue(mockBooking);

    const mockUser = {
      _id: mockUserId,
    };
    User.findById = jest.fn().mockResolvedValue(mockUser);

    const context = { currentUser: { id: mockUserId.toString() } };

    const query = `
      query {
        booking(bookingId: "${mockBookingId}", propertyId: "${mockPropertyId}") {
          id
          property
          user {
            id
          }
        }
      }
    `;

    const response = await graphql({
      schema,
      source: query,
      contextValue: context,
    });

    expect(response.errors).toBeDefined();
    expect(response.errors[0].message).toBe('unauthorized');
  });
});
