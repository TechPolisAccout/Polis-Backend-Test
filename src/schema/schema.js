/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
const lodash = require('lodash');
const graphql = require('graphql');
const Property = require('../models/property');
const ShortletProperty = require('../models/shortlet');
const Booking = require('../models/booking');
const Review = require('../models/review');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const postmark = require('postmark');
const client = new postmark.ServerClient(process.env.POSTMARK_APIKEY);
const NewsletterSubscription = require('../models/newsletterSubscription');
const { Kind } = require('graphql');
const RecentSearch = require('../models/recentSearches');
const Message = require('../models/message');
const B2 = require('backblaze-b2');
const nodemailer = require('nodemailer');
const checkAuth = require('../lib/checkAuth');
const Approval = require('../models/requestApproval');
const moment = require('moment');
const sendNotification = require('../lib/notifications');

//<---------- import email templates ----------->
const {
  EMAIL_VERIFICATION_TEMPLATE,
  BOOKING_REQUEST_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
  ACCOUNT_DELETION_CONFIRMATION_TEMPLATE,
  NEWSLETTER_SUBSCRIPTION_CONFIRMATION_TEMPLATE,
  BOOKING_REQUEST_REJECTED_TEMPLATE,
  BOOKING_REQUEST_APPROVED_TEMPLATE,
} = require('../email_templates/email_templates');
const { checkBookingDateClash, checkPropertyAvailability } = require('../lib/dateClashAndAvailability');

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLID,
  GraphQLBoolean,
  GraphQLScalarType,
  GraphQLInputObjectType,
} = graphql;

const ApprovalStatusEnum = new GraphQLEnumType({
  name: 'ApprovalStatus',
  values: {
    PENDING: { value: 'pending' },
    APPROVED: { value: 'approved' },
    REJECTED: { value: 'rejected' },
  },
});

const DateType = new GraphQLScalarType({
  name: 'Date',
  description:
    'This is a custom scalar type for dates. It serializes JavaScript Date objects into ISO strings, and parses ISO strings into JavaScript Date objects.',
  serialize(value) {
    return value.toISOString();
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const propertyListingEnumType = new GraphQLEnumType({
  name: 'propertyListingType',
  description:
    'This is an enumeration type that represents the listing type of a property. It can have one of two values: ‘rent’ or ‘buy’.',
  values: {
    RENT: { value: 'rent' },
    BUY: { value: 'buy' },
    SHORTLET: { value: 'shortlet' },
  },
});

const AmenityType = new GraphQLObjectType({
  name: 'Amenity',
  description:
    'This is an object type that represents an amenity. It has two fields: ‘name’ and ‘icon’, both of which are strings.',
  fields: () => ({
    name: { type: GraphQLString },
    icon: { type: GraphQLString },
  }),
});

const userRoleEnumType = new GraphQLEnumType({
  name: 'userRole',
  description:
    'This is an enumeration type that represents the role of a user. It can have one of two values: ‘agent’ or ‘regular’.',
  values: {
    agent: { value: 'agent' },
    regular: { value: 'regular' },
  },
});

const genderEnumType = new GraphQLEnumType({
  name: 'gender',
  description:
    'This is an enumeration type that represents the gender of a user. It can have one of two values: ‘Male’ or ‘Female’.',
  values: {
    Male: { value: 'Male' },
    Female: { value: 'Female' },
  },
});

const detailedAddressInputType = new GraphQLInputObjectType({
  name: 'DetailedAddressInput',
  description:
    'This is an input object type that represents a detailed address. It has three fields: ‘street’, ‘city’, and ‘state’, all of which are strings.',
  fields: () => ({
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    state: { type: GraphQLString },
  }),
});

const SpecialNoteInputType = new GraphQLInputObjectType({
  name: 'SpecialNoteInput',
  fields: {
    id: { type: GraphQLInt },
    content: { type: GraphQLString },
  },
});
const thingsToKnowInputType = new GraphQLInputObjectType({
  name: 'ThingsToKnowInput',
  description: ' This is an input object type that represents the things to know of a property. ',
  fields: {
    cancellationPolicy: { type: GraphQLString },
    timeLimit: { type: GraphQLString },
    checkInAfter: { type: GraphQLString },
    checkOutBefore: { type: GraphQLString },
    specialNotes: {
      type: new GraphQLList(SpecialNoteInputType),
    },
  },
});
const AmenitiesInputType = new GraphQLInputObjectType({
  name: 'AmenitiesInput',
  fields: {
    name: { type: GraphQLString },
    icon: { type: GraphQLString },
  },
});
const propertyAttributesInputType = new GraphQLInputObjectType({
  name: 'PropertyAttributesInput',
  description:
    ' This is an input object type that represents the attributes of a property. It has six fields: ‘numberOfBedrooms’, ‘numberOfGarages’, ‘yearBuilt’, ‘size’, ‘numberOfBathrooms’, and ‘propertyType’.',
  fields: () => ({
    numberOfBedrooms: { type: GraphQLInt },
    numberOfGarages: { type: GraphQLInt },
    yearBuilt: { type: GraphQLString },
    size: { type: GraphQLString },
    numberOfBathrooms: { type: GraphQLInt },
    propertyType: { type: GraphQLString },
  }),
});

const floorPlanInputType = new GraphQLInputObjectType({
  name: 'FloorPlanInput',
  description:
    'This is an input object type that represents a floor plan. It has four fields: ‘numberOfFloors’, ‘size’, ‘roomSize’, and ‘bathroomSize’.',
  fields: () => ({
    numberOfFloors: { type: GraphQLInt },
    size: { type: GraphQLString },
    roomSize: { type: GraphQLString },
    bathroomSize: { type: GraphQLString },
  }),
});

const detailedAddressType = new GraphQLObjectType({
  name: 'detailedAddress',
  description:
    'This is an object type that represents a detailed address. It has three fields: ‘street’, ‘city’, and ‘state’, all of which are strings.',
  fields: () => ({
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    state: { type: GraphQLString },
  }),
});

const propertyAttributesType = new GraphQLObjectType({
  name: 'PropertyDetails',
  description:
    'This is an object type that represents the attributes of a property. It has six fields: ‘numberOfBedrooms’, ‘numberOfGarages’, ‘yearBuilt’, ‘size’, ‘numberOfBathrooms’, and ‘propertyType’.',
  fields: () => ({
    numberOfBedrooms: {
      type: GraphQLInt,
    },
    numberOfGarages: {
      type: GraphQLInt,
    },
    yearBuilt: {
      type: GraphQLString,
    },
    size: {
      type: GraphQLString,
    },
    numberOfBathrooms: {
      type: GraphQLInt,
    },
    propertyType: {
      type: GraphQLString,
    },
  }),
});

const shortletPropertyAttributesType = new GraphQLObjectType({
  name: 'ShortletPropertyDetails',
  description:
    'This is an object type that represents the attributes of a property. It has six fields: ‘numberOfBedrooms’, ‘numberOfGarages’, ‘yearBuilt’, ‘size’, ‘numberOfBathrooms’, and ‘propertyType’.',
  fields: () => ({
    numberOfBedrooms: {
      type: GraphQLInt,
    },
    numberOfGuests: {
      type: GraphQLInt,
    },
    numberOfGarages: {
      type: GraphQLInt,
    },
    yearBuilt: {
      type: GraphQLString,
    },
    size: {
      type: GraphQLString,
    },
    numberOfBathrooms: {
      type: GraphQLInt,
    },
    propertyType: {
      type: GraphQLString,
    },
  }),
});

const floorPlanType = new GraphQLObjectType({
  name: 'floorPlan',
  description:
    'This is an object type that represents a floor plan. It has four fields: ‘numberOfFloors’, ‘size’, ‘roomSize’, and ‘bathroomSize’.',
  fields: () => ({
    numberOfFloors: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLString,
    },
    roomSize: {
      type: GraphQLString,
    },
    bathroomSize: {
      type: GraphQLString,
    },
  }),
});

const PropertyRatingType = new GraphQLObjectType({
  name: 'PropertyRating',
  fields: {
    averageRating: { type: GraphQLFloat },
    totalReviews: { type: GraphQLInt },
  },
});

const ThingsToKnowType = new GraphQLObjectType({
  name: 'ThingsToKnow',
  fields: {
    cancellationPolicy: { type: GraphQLString },
    timeLimit: { type: GraphQLString },
    checkInAfter: { type: GraphQLString },
    checkOutBefore: { type: GraphQLString },
    specialNotes: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: 'SpecialNote',
          fields: {
            content: { type: GraphQLString },
          },
        }),
      ),
    },
  },
});

const propertyType = new GraphQLObjectType({
  name: 'Property',
  description:
    'This is an object type that represents a property. It has several fields including ‘id’, ‘listingType’, ‘priceForRent’, ‘priceForBuy’, ‘propertyImageList’, ‘address’, ‘title’, ‘amenities’, ‘favourite’, ‘detailedAddress’, ‘propertyAttributes’, ‘floorPlan’, ‘description’, ‘createdAt’, and ‘user’.',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLString) },
    listingType: { type: GraphQLNonNull(propertyListingEnumType) },
    priceForRent: { type: GraphQLInt },
    priceForBuy: { type: GraphQLInt },
    propertyImageList: { type: GraphQLList(GraphQLString) },
    address: { type: GraphQLString },
    title: { type: GraphQLNonNull(GraphQLString) },
    amenities: {
      type: GraphQLList(AmenityType),
    },
    favourite: { type: GraphQLBoolean },
    detailedAddress: { type: detailedAddressType },
    propertyAttributes: { type: propertyAttributesType },
    floorPlan: { type: floorPlanType },
    description: { type: GraphQLString },
    status: { type: GraphQLString },
    createdAt: { type: DateType },
    user: {
      type: userType,
      resolve: async (parent, args) => {
        const user = await User.findById(parent.user);
        return user;
      },
    },
    userProperties: {
      type: new GraphQLList(propertyType),
      resolve: async (parent, args) => {
        const properties = await Property.find({ user: parent.user });
        return properties;
      },
    },
  }),
});

const shortletPropertyType = new GraphQLObjectType({
  name: 'ShortletProperty',
  description:
    'This is an object type that represents a shortlet property. It has several fields including ‘id’, ‘listingType’, ‘pricePerNight’, ‘propertyImageList’, ‘address’, ‘title’, ‘amenities’, ‘favourite’, ‘detailedAddress’, ‘propertyAttributes’, ‘floorPlan’, ‘description’, ‘createdAt’, ‘user’, ‘bookedDates’, and ‘reviews’.',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLString) },
    listingType: { type: GraphQLNonNull(GraphQLString) },
    pricePerNight: { type: GraphQLInt },
    propertyImageList: { type: GraphQLList(GraphQLString) },
    address: { type: GraphQLString },
    title: { type: GraphQLNonNull(GraphQLString) },
    amenities: {
      type: GraphQLList(AmenityType),
    },
    favourite: { type: GraphQLBoolean },
    detailedAddress: { type: detailedAddressType },
    propertyAttributes: { type: shortletPropertyAttributesType },
    thingsToKnow: { type: ThingsToKnowType },
    floorPlan: { type: floorPlanType },
    description: { type: GraphQLString },
    instantBooking: { type: GraphQLBoolean },
    status: { type: GraphQLString },
    createdAt: { type: DateType },
    averageRating: { type: GraphQLFloat },
    totalReviews: { type: GraphQLInt },
    user: {
      type: userType,
      resolve: async (parent, args) => {
        const user = await User.findById(parent.user);
        return user;
      },
    },
    userProperties: {
      type: new GraphQLList(propertyType),
      resolve: async (parent, args) => {
        const properties = await ShortletProperty.find({ user: parent.user });
        return properties;
      },
    },
    bookedDates: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: 'BookedDate',
          fields: {
            startDate: { type: GraphQLString },
            endDate: { type: GraphQLString },
          },
        }),
      ),
    },
    blockedDates: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: 'BlockedDate',
          fields: {
            startDate: { type: GraphQLString },
            endDate: { type: GraphQLString },
          },
        }),
      ),
    },
    reviews: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: 'Reviews',
          fields: {
            user: { type: GraphQLString },
            rating: { type: GraphQLInt },
            comment: { type: GraphQLString },
          },
        }),
      ),
    },
  }),
});

const BlockUnblockPropertyType = new GraphQLObjectType({
  name: 'BlockUnblockProperty',
  fields: () => ({
    message: { type: GraphQLNonNull(GraphQLString) },
    property: { type: shortletPropertyType },
  }),
});

const userType = new GraphQLObjectType({
  name: 'User',
  description:
    'This is an object type that represents a user. It has several fields including ‘id’, ‘name’, ‘email’, ‘role’, ‘gender’, ‘dateOfBirth’, ‘address’, ‘about’, ‘phoneNumber’, ‘createdAt’, ‘profilePictureUrl’, ‘website’, ‘properties’, and ‘wishlist’. The fields ‘id’ and ‘email’ are mandatory as indicated by the ! symbol.',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    email: { type: GraphQLNonNull(GraphQLString) },
    role: { type: userRoleEnumType },
    gender: { type: genderEnumType },
    dateOfBirth: { type: GraphQLString },
    address: { type: GraphQLString },
    about: { type: GraphQLString },
    phoneNumber: { type: GraphQLString },
    createdAt: { type: DateType },
    profilePictureUrl: { type: GraphQLString },
    website: { type: GraphQLString },
    properties: {
      type: new GraphQLList(propertyType),
      resolve: async (parent, args) => {
        const properties = await Property.find({ user: parent.id });
        return properties;
      },
    },
    wishlist: {
      type: new GraphQLList(propertyType),
      resolve: async (parent, args) => {
        const user = await User.findById(parent.id).populate('wishlist.property');
        return user.wishlist.map((item) => item.property);
      },
    },
    shortletWishlist: {
      type: new GraphQLList(shortletPropertyType),
      resolve: async (parent, args) => {
        const user = await User.findById(parent.id).populate('shortletWishlist.shortlet');
        return user.shortletWishlist.map((item) => item.shortlet);
      },
    },
    bookings: {
      type: new GraphQLList(BookingType),
      resolve: async (parent, args) => {
        const bookings = await Booking.find({ user: parent.id });
        return bookings;
      },
    },
    shortlets: {
      type: new GraphQLList(shortletPropertyType),
      resolve: async (parent, args) => {
        const shortlets = await ShortletProperty.find({ user: parent.id });
        return shortlets;
      },
    },
  }),
});

const BookingType = new GraphQLObjectType({
  name: 'Booking',
  fields: {
    id: { type: GraphQLNonNull(GraphQLID) },
    user: {
      type: userType,
      resolve: async (parent, args) => {
        const user = await User.findById(parent.user);
        return user;
      },
    },
    property: {
      type: GraphQLNonNull(GraphQLID),
      resolve: async (parent, args) => {
        const property = await ShortletProperty.findById(parent.property);
        if (!property) {
          throw new Error(`Property with ID ${parent.property} not found.`);
        }
        return property._id;
      },
    },
    propertyDetails: {
      // This field returns the full property object
      type: shortletPropertyType,
      resolve: async (parent, args) => {
        const property = await ShortletProperty.findById(parent.property);
        if (!property) {
          throw new Error(`Property with ID ${parent.property} not found.`);
        }
        return property;
      },
    },
    startDate: { type: GraphQLNonNull(GraphQLString) },
    endDate: { type: GraphQLNonNull(GraphQLString) },
    numberOfGuests: { type: GraphQLNonNull(GraphQLInt) },
    numberOfNights: { type: GraphQLInt },
    serviceCharge: { type: GraphQLInt },
    costForNights: { type: GraphQLInt },
    totalCost: { type: GraphQLInt },
    averageRating: { type: GraphQLFloat },
    totalReviews: { type: GraphQLInt },
    enablePayment: { type: GraphQLBoolean },
    status: { type: GraphQLString },
    isActive: { type: GraphQLBoolean },
    linkedBooking: { type: GraphQLID },
    createdAt: { type: DateType },
    payment: {
      type: new GraphQLObjectType({
        name: 'Payment',
        fields: {
          status: { type: GraphQLString },
          transactionId: { type: GraphQLString },
        },
      }),
    },
  },
});

const ApprovalType = new GraphQLObjectType({
  name: 'Approval',
  fields: {
    id: { type: GraphQLNonNull(GraphQLID) },
    booking: {
      type: BookingType,
      resolve: async (parent, args) => {
        return await Booking.findById(parent.booking);
      },
    },
    user: {
      type: userType,
      resolve: async (parent, args) => {
        return await User.findById(parent.user);
      },
    },
    message: { type: GraphQLString },
    status: { type: ApprovalStatusEnum },
    createdAt: { type: GraphQLNonNull(GraphQLString) },
  },
});

const ApprovalWithConflictType = new GraphQLObjectType({
  name: 'ApprovalWithConflictType',
  fields: {
    approval: { type: ApprovalType },
    conflictingRequests: { type: new GraphQLList(ApprovalType) },
  },
});

const BookingWithCursorType = new GraphQLObjectType({
  name: 'BookingWithCursorType',
  fields: {
    booking: { type: BookingType }, // Use the modified userBookingType
    cursor: { type: GraphQLString },
  },
});

const bookingListWithPagination = new GraphQLObjectType({
  name: 'BookingListWithPagination',
  fields: {
    bookings: { type: new GraphQLList(BookingWithCursorType) },
    hasMore: { type: GraphQLBoolean },
  },
});

const AddReviewType = new GraphQLObjectType({
  name: 'AddReview',
  fields: {
    user: { type: GraphQLID },
    property: { type: GraphQLID },
    rating: { type: GraphQLInt },
    comment: { type: GraphQLString },
  },
});

const ReviewType = new GraphQLObjectType({
  name: 'Review',
  fields: {
    user: { type: userType },
    rating: { type: GraphQLInt },
    date: { type: GraphQLString },
    comment: { type: GraphQLString },
  },
});

const SearchType = new GraphQLObjectType({
  name: 'Search',
  description:
    'This object type, named "Search", encapsulates the search data associated with a user. It comprises two fields: "userId" and "searches".',

  fields: {
    userId: {
      type: GraphQLNonNull(GraphQLString),
      description:
        'The "userId" field is of type GraphQLNonNull(GraphQLString), meaning it is a non-nullable string. This field represents the unique identifier of a user.',
    },
    searches: {
      type: GraphQLList(GraphQLString),
      description:
        'The "searches" field is of type GraphQLList(GraphQLString), indicating it is a list of strings. This field represents the search queries made by the user.',
    },
  },
});

const MessageType = new GraphQLObjectType({
  name: 'Message',
  description:
    'This is an object type that represents a message. It has several fields including ‘userId’, ‘listingId’, ‘senderId’, ‘listingOwner’, and ‘messages’. The ‘messages’ field is a list of ‘MessageItem’ objects, each of which has several fields including ‘userId’, ‘senderId’, ‘listingId’, ‘text’, ‘pic’, ‘title’, ‘name’, ‘createdAt’, ‘read’, ‘listingOwnerEmail’, ‘senderEmail’, ‘listingOwnerName’, ‘listingType’, and ‘recipientId’. All fields in the ‘MessageItem’ object are mandatory as indicated by the ! symbol',
  fields: {
    userId: { type: GraphQLNonNull(GraphQLString) },
    listingId: { type: GraphQLNonNull(GraphQLString) },
    senderId: { type: GraphQLNonNull(GraphQLString) },
    listingOwner: { type: GraphQLNonNull(GraphQLString) },
    messages: {
      type: GraphQLList(
        new GraphQLObjectType({
          name: 'MessageItem',
          fields: {
            userId: { type: GraphQLNonNull(GraphQLString) },
            senderId: { type: GraphQLNonNull(GraphQLString) },
            listingId: { type: GraphQLNonNull(GraphQLString) },
            text: { type: GraphQLNonNull(GraphQLString) },
            pic: { type: GraphQLNonNull(GraphQLString) },
            title: { type: GraphQLNonNull(GraphQLString) },
            name: { type: GraphQLNonNull(GraphQLString) },
            createdAt: { type: GraphQLString },
            read: { type: GraphQLBoolean },
            listingOwnerEmail: { type: GraphQLNonNull(GraphQLString) },
            senderEmail: { type: GraphQLNonNull(GraphQLString) },
            listingOwnerName: { type: GraphQLNonNull(GraphQLString) },
            listingType: { type: GraphQLNonNull(GraphQLString) },
            recipientId: { type: GraphQLNonNull(GraphQLString) },
          },
        }),
      ),
    },
  },
});

const PropertyWithCursorType = new GraphQLObjectType({
  name: 'PropertyWithCursor',
  fields: {
    property: { type: propertyType },
    cursor: { type: GraphQLString },
  },
});

const ApprovalWithNumberType = new GraphQLObjectType({
  name: 'ApprovalWithNumber',
  fields: {
    property: { type: shortletPropertyType },
    numberOfApprovals: { type: GraphQLInt },
  },
});
const ApprovalForReviewType = new GraphQLObjectType({
  name: 'ApprovalForReview',
  fields: {
    approval: { type: ApprovalType },
  },
});

const ApprovalRequestsWithHasMoreType = new GraphQLObjectType({
  name: 'ApprovalRequestsWithHasMore',
  fields: {
    approvals: { type: new GraphQLList(ApprovalWithNumberType) },
    excludedPropertyIds: { type: new GraphQLList(GraphQLString) },
    hasMore: { type: GraphQLBoolean },
  },
});
const ApprovalRequestsForReviewWithHasMoreType = new GraphQLObjectType({
  name: 'ApprovalRequestsForReviewWithHasMore',
  fields: {
    approvals: { type: new GraphQLList(ApprovalForReviewType) },
    cursor: { type: GraphQLNonNull(GraphQLID) },
    hasMore: { type: GraphQLBoolean },
  },
});

const ReviewWithCursorType = new GraphQLObjectType({
  name: 'ReviewWithCursor',
  fields: {
    review: { type: ReviewType },
    cursor: { type: GraphQLString },
  },
});

const ShortletPropertyWithCursorType = new GraphQLObjectType({
  name: 'ShortletPropertyWithCursorType',
  fields: {
    property: { type: shortletPropertyType },
    cursor: { type: GraphQLString },
  },
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  description:
    ' RootQuery defines the top level GraphQL queries that can be made against the schema. It contains fields for fetching all properties,properties by filters like listing type, individual properties by ID, properties for a specific user, all users, an individual user by ID, recent searches by a user, messages by listing or user, and messages for a specific user and listing. Each field is resolved asynchronously by calling the appropriate Mongoose model find method.',

  fields: () => ({
    allProperties: {
      type: GraphQLList(PropertyWithCursorType),
      description:
        'This field returns a list of all properties in the database. It requires three arguments: `cursor`, which is used for pagination, `limit`, which is the maximum number of properties to return, and `address`, which is used to filter properties by address. If the `cursor` argument is provided, the query will return properties with IDs greater than the `cursor`. If the `address` argument is provided, the query will return properties whose address matches the `address` argument.',
      args: {
        cursor: { type: GraphQLString },
        limit: { type: GraphQLInt },
        address: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        console.log(context);
        const { cursor, limit, address } = args;
        let query = {};
        if (address) {
          query.address = { $regex: new RegExp(address, 'i') };
        }
        if (cursor) {
          query._id = { $gt: cursor };
        }
        const properties = await Property.find(query).limit(limit);

        return properties.map((property) => ({
          property,
          cursor: property._id.toString(),
        }));
      },
    },
    properties: {
      type: new GraphQLObjectType({
        name: 'PropertiesWithHasMore',
        fields: {
          properties: { type: new GraphQLList(PropertyWithCursorType) },
          hasMore: { type: GraphQLBoolean },
        },
      }),
      description:
        'This field returns a list of properties based on the `listingType` and `address` arguments. It requires four arguments: `cursor`, which is used for pagination, `limit`, which is the maximum number of properties to return, `listingType`, which is used to filter properties by listing type, and `address`, which is used to filter properties by address. If the `cursor` argument is provided, the query will return properties with IDs greater than the `cursor`. The `listingType` and `address` arguments are mandatory and the query will return properties whose listing type matches the `listingType` argument and whose address matches the `address` argument.',
      args: {
        cursor: { type: GraphQLString },
        limit: { type: GraphQLNonNull(GraphQLInt) },
        listingType: { type: GraphQLNonNull(propertyListingEnumType) },
        address: { type: GraphQLString },
      },
      resolve: async (parent, args) => {
        const { cursor, limit, listingType, address } = args;
        let query = { listingType: listingType, address: address };
        if (cursor) {
          query._id = { $gt: cursor };
        }
        let properties = await Property.find(query).limit(limit + 1);
        const hasMore = properties.length > limit;
        if (hasMore) {
          properties = properties.slice(0, -1);
        }
        return {
          properties: properties.map((property) => ({
            property,
            cursor: property._id.toString(),
          })),
          hasMore,
        };
      },
    },

    shortletProperties: {
      type: new GraphQLObjectType({
        name: 'ShortletPropertiesWithHasMore',
        fields: {
          properties: { type: new GraphQLList(ShortletPropertyWithCursorType) },
          hasMore: { type: GraphQLBoolean },
        },
      }),
      description:
        'This field returns a list of properties based on the `listingType` and `address` arguments. It requires four arguments: `cursor`, which is used for pagination, `limit`, which is the maximum number of properties to return, `listingType`, which is used to filter properties by listing type, and `address`, which is used to filter properties by address. If the `cursor` argument is provided, the query will return properties with IDs greater than the `cursor`. The `listingType` and `address` arguments are mandatory and the query will return properties whose listing type matches the `listingType` argument and whose address matches the `address` argument.',
      args: {
        cursor: { type: GraphQLString },
        limit: { type: GraphQLNonNull(GraphQLInt) },
        listingType: { type: GraphQLNonNull(propertyListingEnumType) },
        address: { type: GraphQLString },
      },
      resolve: async (parent, args) => {
        const { cursor, limit, listingType, address } = args;
        let query = { listingType: listingType, address: address };
        if (cursor) {
          query._id = { $gt: cursor };
        }
        let properties = await ShortletProperty.find(query).limit(limit + 1);
        const hasMore = properties.length > limit;
        if (hasMore) {
          properties = properties.slice(0, -1);
        }
        return {
          properties: properties.map((property) => ({
            property,
            cursor: property._id.toString(),
          })),
          hasMore,
        };
      },
    },

    property: {
      type: propertyType,
      description:
        ' This field returns a single property based on the `id` argument. It uses the Property.findById(`id`) method to fetch the property with the specified ID.',
      args: {
        id: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, { id }) => {
        const property = await Property.findById(id);
        if (!property) {
          throw new Error(`Property with ID ${id} not found.`);
        }
        return property;
      },
    },
    propertiesByUser: {
      type: new GraphQLObjectType({
        name: 'PropertiesByUserWithHasMore',
        fields: {
          properties: { type: new GraphQLList(PropertyWithCursorType) },
          hasMore: { type: GraphQLBoolean },
        },
      }),
      description:
        'This field returns a list of properties associated with a specific user, based on the `userId` argument. It uses the Property.find({ user: `userId` }) method to fetch properties associated with the specified user.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        cursor: { type: GraphQLString },
        limit: { type: GraphQLInt },
        listingType: { type: propertyListingEnumType },
      },
      resolve: async (parent, { userId, cursor, limit, listingType }, context) => {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found.');
        let query = { user: userId };
        if (cursor) {
          query._id = { $gt: cursor };
        }
        if (listingType) {
          query.listingType = listingType;
        }
        let properties = await Property.find(query).limit(limit + 1);
        const hasMore = properties.length > limit;
        if (hasMore) {
          properties = properties.slice(0, -1);
        }
        return {
          properties: properties.map((property) => ({
            property,
            cursor: property._id.toString(),
          })),
          hasMore,
        };
      },
    },

    userShortletProperties: {
      type: new GraphQLObjectType({
        name: 'UserShortletPropertiesWithHasMore',
        fields: {
          properties: { type: new GraphQLList(ShortletPropertyWithCursorType) },
          hasMore: { type: GraphQLBoolean },
        },
      }),
      description:
        'This field returns a list of properties associated with a specific user, based on the `userId` argument. It uses the Property.find({ user: `userId` }) method to fetch properties associated with the specified user.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        cursor: { type: GraphQLString },
        limit: { type: GraphQLInt },
        listingType: { type: propertyListingEnumType },
      },
      resolve: async (parent, { userId, cursor, limit, listingType }, context) => {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found.');
        let query = { user: userId };
        if (cursor) {
          query._id = { $gt: cursor };
        }
        if (listingType) {
          query.listingType = listingType;
        }
        let properties = await ShortletProperty.find(query).limit(limit + 1);
        const hasMore = properties.length > limit;
        if (hasMore) {
          properties = properties.slice(0, -1);
        }
        return {
          properties: properties.map((property) => ({
            property,
            cursor: property._id.toString(),
          })),
          hasMore,
        };
      },
    },

    users: {
      type: GraphQLList(userType),
      description:
        'This field returns a list of all users in the database. It uses the User.find({}) method to fetch all users.',
      resolve: async () => {
        return await User.find({});
      },
    },
    user: {
      type: userType,
      args: {
        id: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, { id }) => {
        const user = await User.findById(id);
        if (!user) throw new Error('User not found.');
        return user;
      },
    },
    wishlistByUser: {
      type: new GraphQLObjectType({
        name: 'WishlistWithHasMore',
        fields: {
          wishlist: { type: new GraphQLList(PropertyWithCursorType) },
          hasMore: { type: GraphQLBoolean },
        },
      }),
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        wishlistCursor: { type: GraphQLString },
        wishlistLimit: { type: GraphQLInt },
        propertyListingType: { type: propertyListingEnumType },
      },
      resolve: async (parent, { userId, wishlistCursor, wishlistLimit, propertyListingType }, context) => {
        // Fetch user and check if it exists before calling populate
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found.'); // Throw error if user does not exist

        // Populate wishlist only if the user exists
        await user.populate('wishlist.property');

        let wishlist = user.wishlist || [];

        if (wishlistCursor) {
          wishlist = wishlist.filter((item) => item._id > wishlistCursor);
        }

        wishlist.sort((a, b) => b.dateAdded - a.dateAdded);

        if (propertyListingType) {
          wishlist = wishlist.filter((item) => item?.property?.listingType === propertyListingType);
        }

        let hasMore = false;
        if (wishlistLimit > 0) {
          wishlist = wishlist.slice(0, wishlistLimit + 1);
          hasMore = wishlist.length > wishlistLimit;
          if (hasMore) wishlist = wishlist.slice(0, -1);
        }

        return {
          wishlist: wishlist.map((item) => ({
            property: item.property,
            cursor: item._id?.toString(),
          })),
          hasMore,
        };
      },
    },
    // wishlistByUser: {
    //   type: new GraphQLObjectType({
    //     name: 'WishlistWithHasMore',
    //     fields: {
    //       wishlist: { type: new GraphQLList(PropertyWithCursorType) },
    //       hasMore: { type: GraphQLBoolean },
    //     },
    //   }),
    //   args: {
    //     userId: { type: GraphQLNonNull(GraphQLString) },
    //     wishlistCursor: { type: GraphQLString },
    //     wishlistLimit: { type: GraphQLInt },
    //     propertyListingType: { type: propertyListingEnumType },
    //   },
    //   resolve: async (parent, { userId, wishlistCursor, wishlistLimit, propertyListingType }, context) => {
    //     // checkAuth(context, userId, 'You can only access your own wishlist');
    //     const user = await User.findById(userId).populate('wishlist.property');

    //     if (!user) throw new Error('User not found.');

    //     let wishlist = user.wishlist || [];
    //     // let wishlist = user.wishlist;
    //     if (wishlistCursor) {
    //       wishlist = wishlist.filter((item) => item._id > wishlistCursor);
    //     }
    //     wishlist.sort((a, b) => b.dateAdded - a.dateAdded);
    //     if (propertyListingType) {
    //       wishlist = wishlist.filter((item) => item?.property?.listingType === propertyListingType);
    //     }
    //     let hasMore = false;
    //     if (wishlistLimit > 0) {
    //       wishlist = wishlist.slice(0, wishlistLimit + 1);
    //       hasMore = wishlist.length > wishlistLimit;
    //       if (hasMore) {
    //         wishlist = wishlist.slice(0, -1);
    //       }
    //     }
    //     return {
    //       wishlist: wishlist.map((item) => ({
    //         property: item.property,
    //         cursor: item._id.toString(),
    //       })),
    //       hasMore,
    //     };
    //   },
    // },
    shortletWishlistByUser: {
      type: new GraphQLObjectType({
        name: 'ShortletWishlistWithHasMore',
        fields: {
          shortletWishlist: { type: new GraphQLList(ShortletPropertyWithCursorType) },
          hasMore: { type: GraphQLBoolean },
        },
      }),
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        wishlistCursor: { type: GraphQLString },
        wishlistLimit: { type: GraphQLInt },
      },
      resolve: async (parent, { userId, wishlistCursor, wishlistLimit }) => {
        const user = await User.findById(userId).populate('shortletWishlist.shortlet');

        if (!user) {
          throw new Error('User not found.');
        }
        let shortletWishlist = user.shortletWishlist;

        console.log({ shortletWishlist });

        if (wishlistCursor) {
          shortletWishlist = shortletWishlist.filter((item) => item._id > wishlistCursor);
        }

        shortletWishlist.sort((a, b) => b.dateAdded - a.dateAdded);

        let hasMore = false;
        if (wishlistLimit > 0) {
          shortletWishlist = shortletWishlist.slice(0, wishlistLimit + 1);
          hasMore = shortletWishlist.length > wishlistLimit;
          if (hasMore) {
            shortletWishlist = shortletWishlist.slice(0, -1);
          }
        }

        return {
          shortletWishlist: shortletWishlist.map((item) => ({
            property: item.shortlet,
            cursor: item._id.toString(),
          })),
          hasMore,
        };
      },
    },
    recentSearch: {
      type: SearchType,
      description:
        'This field returns the most recent search made by a specific user, based on the `userId` argument. It uses the RecentSearch.findOne({ `userId` }) method to fetch the most recent search made by the specified user.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { userId }, context) => {
        checkAuth(context, userId, 'You can only access your own recent searches');
        return await RecentSearch.findOne({ userId });
      },
    },
    messagesByListing: {
      type: GraphQLList(MessageType),
      description:
        'This field returns a list of messages associated with a specific listing, based on the `listingId` argument. It uses the Message.find({ `listingId` }) method to fetch messages associated with the specified listing.',
      args: {
        listingId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { listingId }) => {
        return Message.find({ listingId });
      },
    },
    messagesByUser: {
      type: GraphQLList(MessageType),
      description:
        'This field returns a list of messages sent by a specific user, based on the `userId` argument. It uses the Message.find({ `userId` }) method to fetch messages sent by the specified user.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { userId }) => {
        return Message.find({ userId });
      },
    },
    messageByUserAndListing: {
      type: MessageType,
      description:
        'This field returns a single message sent by a specific user for a specific listing, based on the `userId` and `listingId` arguments. It uses the Message.findOne({ userId, listingId }) method to fetch the message.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        listingId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { userId, listingId }) => {
        return Message.findOne({ userId, listingId });
      },
    },

    propertyReviews: {
      type: new GraphQLObjectType({
        name: 'ReviewsWithHasMore',
        fields: {
          reviews: { type: new GraphQLList(ReviewWithCursorType) },
          hasMore: { type: GraphQLBoolean },
        },
      }),
      args: {
        propertyId: { type: GraphQLNonNull(GraphQLID) },
        cursor: { type: GraphQLString },
        limit: { type: GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (parent, { propertyId, cursor, limit }, context) => {
        let query = { property: propertyId };
        if (cursor) {
          query._id = { $gt: cursor };
        }
        let reviews = await Review.find(query)
          .populate('user')
          .limit(limit + 1);

        const hasMore = reviews.length > limit;
        if (hasMore) {
          reviews = reviews.slice(0, -1);
        }

        return {
          reviews: reviews.map((review) => ({
            review,
            cursor: review._id.toString(),
          })),
          hasMore,
        };
      },
    },

    // propertyRating: {
    //   type: PropertyRatingType,
    //   args: {
    //     propertyId: { type: GraphQLNonNull(GraphQLID) },
    //   },
    //   resolve: async (parent, args, context) => {
    //     const propertyId = new mongoose.Types.ObjectId(args.propertyId);

    //     const pipeline = [
    //       { $match: { _id: propertyId } },
    //       { $unwind: '$reviews' },
    //       {
    //         $group: {
    //           _id: '$_id',
    //           averageRating: { $avg: '$reviews.rating' },
    //           totalReviews: { $sum: 1 },
    //         },
    //       },
    //     ];

    //     const result = await ShortletProperty.aggregate(pipeline);

    //     return {
    //       averageRating: parseFloat(result[0].averageRating.toFixed(1)),
    //       totalReviews: result[0].totalReviews,
    //     };
    //   },
    // },

    propertyRating: {
      type: PropertyRatingType,
      args: {
        propertyId: { type: GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, args, context) => {
        const propertyId = new mongoose.Types.ObjectId(args.propertyId);

        const pipeline = [
          { $match: { _id: propertyId } },
          { $unwind: { path: '$reviews', preserveNullAndEmptyArrays: true } }, // Preserve properties with no reviews
          {
            $group: {
              _id: '$_id',
              averageRating: { $avg: '$reviews.rating' },
              totalReviews: { $sum: { $cond: [{ $ifNull: ['$reviews', false] }, 1, 0] } }, // Count only existing reviews
            },
          },
        ];

        const result = await ShortletProperty.aggregate(pipeline);

        if (result.length === 0) {
          return {
            averageRating: null,
            totalReviews: 0,
          };
        }

        return {
          averageRating: parseFloat(result[0].averageRating.toFixed(1)),
          totalReviews: result[0].totalReviews,
        };
      },
    },

    shortLetProperty: {
      type: shortletPropertyType,
      args: {
        id: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        const property = await ShortletProperty.findById(args.id);
        if (!property) {
          throw new Error(`Property with ID ${args.id} not found.`);
        }
        return property;
      },
    },
    booking: {
      type: BookingType,
      args: {
        bookingId: { type: new GraphQLNonNull(GraphQLString) },
        propertyId: { type: new GraphQLNonNull(GraphQLString) },
        checkOutLinkToken: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        const booking = await Booking.findOne({
          _id: args.bookingId,
          property: args.propertyId,
        });
        if (!booking) {
          throw new Error('unauthorized');
        }
        if (booking.payment.status === 'Completed') {
          throw new Error('unauthorized');
        }
        let currentUserBooking = booking.user.toString() === context.currentUser.id.toString();
        if (!currentUserBooking) {
          throw new Error('unauthorized');
        }

        if (args.checkOutLinkToken) {
          try {
            //<-------- validate the checkout link token -------->
            const { bookingId } = jwt.verify(args.checkOutLinkToken, process.env.JWT_SECRET);
            if (bookingId.toString() !== booking._id.toString()) {
              console.log('Booking ID mismatch');
              throw new Error('unauthorized');
            }
          } catch (error) {
            throw new Error('unauthorized');
          }
        }
        return booking;
      },
    },
    approvalRequests: {
      type: ApprovalRequestsWithHasMoreType,
      args: {
        excludedPropertyIds: { type: new GraphQLList(GraphQLString) },
        limit: { type: GraphQLInt },
      },
      resolve: async (parent, { excludedPropertyIds, limit }, context) => {
        if (!context.currentUser) {
          throw new Error('This page is restricted to logged-in users only.');
        }
        let propertyQuery = { user: new mongoose.Types.ObjectId(context.currentUser.id), instantBooking: false };
        if (excludedPropertyIds.length > 0) {
          propertyQuery._id = { $nin: excludedPropertyIds.map((id) => new mongoose.Types.ObjectId(id)) };
        }
        let aggregatedProperties = await ShortletProperty.aggregate([
          {
            $match: propertyQuery,
          },
          {
            $lookup: {
              from: 'bookings',
              localField: '_id',
              foreignField: 'property',
              as: 'bookings',
            },
          },

          { $unwind: '$bookings' },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $ne: ['$bookings.status', 'Confirmed'],
                  },
                  {
                    $eq: ['$bookings.enablePayment', false],
                  },
                ],
              },
            },
          },
          {
            $lookup: {
              localField: 'bookings._id',
              foreignField: 'booking',
              from: 'approvals',
              as: 'approvals',
            },
          },
          { $unwind: '$approvals' },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$approvals.status', 'pending'],
                  },
                ],
              },
            },
          },
          { $sort: { 'approvals.createdAt': -1 } },
          {
            $group: {
              _id: '$_id',
              property: { $first: '$$ROOT' },
              mostRecentApprovalDate: {
                $first: '$approvals.createdAt',
              },
              numberOfApprovals: { $sum: 1 },
            },
          },
          { $sort: { mostRecentApprovalDate: -1 } },
          { $limit: limit + 1 },
        ]);

        if (aggregatedProperties.length === 0) {
          throw new Error(
            `${excludedPropertyIds.length > 0 ? 'No additional shortlets with bookings were found' : 'You have no booked shortlets'}`,
          );
        }
        const hasMore = aggregatedProperties.length > limit;

        let limitedProperties = aggregatedProperties.slice(0, limit);
        let propertyIdsToExclude = [];
        for (let index = 0; index < limitedProperties.length; index++) {
          propertyIdsToExclude.push(limitedProperties[index].property._id.toString());
        }
        const result = {
          approvals: limitedProperties.map((aggregate) => ({
            property: {
              ...aggregate.property,
              id: aggregate.property._id.toString(),
              createdAt: aggregate.property.createdAt,
              title: aggregate.property.title,
              propertyImageList: aggregate.property.propertyImageList,
              address: aggregate.property.address,
              propertyAttributes: {
                ...aggregate.property.propertyAttributes,
                propertyType: aggregate.property.propertyAttributes.propertyType,
                numberOfBedrooms: aggregate.property.propertyAttributes.numberOfBedrooms,
              },
            },
            numberOfApprovals: aggregate.numberOfApprovals,
          })),
          excludedPropertyIds: propertyIdsToExclude,
          hasMore,
        };
        return result;
      },
    },
    approvalRequestsForReview: {
      type: ApprovalRequestsForReviewWithHasMoreType,
      args: {
        propertyId: { type: GraphQLString },
        cursor: { type: GraphQLString },
        limit: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (parent, { propertyId, cursor, limit }, context) => {
        if (!context.currentUser) {
          throw new Error('This page is restricted to logged-in users only.');
        }
        const property = await ShortletProperty.findById(propertyId);
        if (!property) {
          throw new Error('Property not found');
        }
        if (property.user.toString() !== context.currentUser.id) {
          throw new Error('You do not have permission to view the bookings for shortlets that do not belong to you.');
        }
        let error;
        let hasMore = true;
        let approvals = [];
        let fetchedApprovals = 0;
        let lastFetchedBookingId = cursor;

        while (fetchedApprovals < limit && hasMore) {
          let bookingQuery = { enablePayment: false, property: propertyId, status: 'Pending' };
          if (lastFetchedBookingId) {
            bookingQuery._id = { $lt: lastFetchedBookingId };
          }

          const bookings = await Booking.find(bookingQuery)
            .sort({ createdAt: -1 })
            .limit(limit + 1) //fetch one more to know if there are more bookings
            .exec();
          if (bookings.length === 0) {
            hasMore = false;
            error = `No ${lastFetchedBookingId ? 'more approval request to load.' : 'bookings found for this property'}`;
            break;
          }

          hasMore = bookings.length > limit;

          const bookingIds = bookings.map((booking) => booking._id);
          const newApprovals = await Approval.find({ booking: { $in: bookingIds }, status: 'pending' })
            .sort({ createdAt: -1 })
            .populate({
              path: 'booking',
              populate: { path: 'property' },
            })
            .populate('user')
            .exec();
          approvals = approvals.concat(newApprovals);
          fetchedApprovals += newApprovals.length;

          lastFetchedBookingId = bookings[bookings.length === 1 ? 0 : bookings.length - 2]._id.toString(); //we use 2 here just to get the last id of the booking and not the extra booking

          if (bookings.length < limit) {
            hasMore = false;
            break;
          }
        }
        if (error) {
          throw new Error(error);
        }

        approvals = approvals.slice(0, limit);

        return {
          approvals: approvals.map((approval) => ({
            approval,
          })),
          cursor: lastFetchedBookingId,
          hasMore: hasMore && fetchedApprovals >= limit,
        };
      },
    },

    // Completed Bookings
    completedBookings: {
      type: bookingListWithPagination,
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        cursor: { type: GraphQLString },
        limit: { type: GraphQLInt },
      },
      resolve: async (parent, { userId, cursor, limit }) => {
        const user = await User.findById(userId).populate('bookings');
        let completedBookings = user.bookings.filter((booking) => {
          return booking.endDate < new Date() && booking.payment.status === 'Completed';
        });

        if (cursor) {
          completedBookings = completedBookings.filter((booking) => booking._id > cursor);
        }

        completedBookings.sort((a, b) => b.endDate - a.endDate);

        let hasMore = false;
        if (limit > 0) {
          completedBookings = completedBookings.slice(0, limit + 1);
          hasMore = completedBookings.length > limit;
          if (hasMore) {
            completedBookings = completedBookings.slice(0, -1);
          }
        }

        return {
          bookings: completedBookings.map((booking) => ({
            booking,
            cursor: booking._id.toString(),
          })),
          hasMore,
        };
      },
    },

    // Upcoming Bookings
    upcomingBookings: {
      type: bookingListWithPagination,
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        cursor: { type: GraphQLString },
        limit: { type: GraphQLInt },
      },
      resolve: async (parent, { userId, cursor, limit }) => {
        const user = await User.findById(userId).populate('bookings');
        let upcomingBookings = user.bookings.filter((booking) => {
          return booking.startDate > new Date() && booking.payment.status === 'Completed';
        });

        if (cursor) {
          upcomingBookings = upcomingBookings.filter((booking) => booking._id > cursor);
        }

        upcomingBookings.sort((a, b) => a.startDate - b.startDate);

        let hasMore = false;
        if (limit > 0) {
          upcomingBookings = upcomingBookings.slice(0, limit + 1);
          hasMore = upcomingBookings.length > limit;
          if (hasMore) {
            upcomingBookings = upcomingBookings.slice(0, -1);
          }
        }

        return {
          bookings: upcomingBookings.map((booking) => ({
            booking,
            cursor: booking._id.toString(),
          })),
          hasMore,
        };
      },
    },

    declinedBookings: {
      type: bookingListWithPagination,
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        cursor: { type: GraphQLString },
        limit: { type: GraphQLInt },
      },
      resolve: async (parent, { userId, cursor, limit }) => {
        let declinedBookings = await Approval.find({
          user: userId,
          status: 'rejected',
        });

        if (cursor) {
          declinedBookings = declinedBookings.filter((booking) => booking._id > cursor);
        }

        declinedBookings.sort((a, b) => b.createdAt - a.createdAt);
        let hasMore = false;
        if (limit > 0) {
          declinedBookings = declinedBookings.slice(0, limit + 1);
          hasMore = declinedBookings.length > limit;
          if (hasMore) {
            declinedBookings = declinedBookings.slice(0, -1);
          }
        }

        return {
          bookings: declinedBookings.map((booking) => ({
            booking,
            cursor: booking._id.toString(),
          })),
          hasMore,
        };
      },
    },

    pendingBookings: {
      type: bookingListWithPagination,
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        cursor: { type: GraphQLString },
        limit: { type: GraphQLInt },
      },
      resolve: async (parent, { userId, cursor, limit }) => {
        let pendingBookings = await Approval.find({
          user: userId,
          status: 'pending',
        });

        if (cursor) {
          pendingBookings = pendingBookings.filter((booking) => booking._id > cursor);
        }

        pendingBookings.sort((a, b) => b.createdAt - a.createdAt);
        let hasMore = false;
        if (limit > 0) {
          pendingBookings = pendingBookings.slice(0, limit + 1);
          hasMore = pendingBookings.length > limit;
          if (hasMore) {
            pendingBookings = pendingBookings.slice(0, -1);
          }
        }

        return {
          bookings: pendingBookings.map((booking) => ({
            booking,
            cursor: booking._id.toString(),
          })),
          hasMore,
        };
      },
    },

    similarPropertiesQuery: {
      type: new GraphQLObjectType({
        name: 'SimilarPropertiesQuery',
        fields: {
          properties: { type: new GraphQLList(PropertyWithCursorType) },
          hasMore: { type: GraphQLBoolean },
        },
      }),
      args: {
        address: { type: GraphQLNonNull(GraphQLString) },
        listingType: { type: GraphQLNonNull(GraphQLString) },
        numberOfBedrooms: { type: GraphQLInt },
        cursor: { type: GraphQLString },
        limit: { type: GraphQLInt },
      },
      resolve: async (parent, { address, listingType, numberOfBedrooms, cursor, limit }) => {
        let query = {
          address,
          listingType,
          'propertyAttributes.numberOfBedrooms': numberOfBedrooms,
        };

        let similarProperties = await Property.find(query);

        if (cursor) {
          similarProperties = similarProperties.filter((property) => property._id > cursor);
        }

        similarProperties.sort((a, b) => a._id - b._id);

        let hasMore = false;
        if (limit > 0) {
          similarProperties = similarProperties.slice(0, limit + 1);
          hasMore = similarProperties.length > limit;
          if (hasMore) {
            similarProperties = similarProperties.slice(0, -1);
          }
        }

        return {
          properties: similarProperties.map((property) => ({
            property,
            cursor: property._id.toString(),
          })),
          hasMore,
        };
      },
    },

    similarShortletPropertiesQuery: {
      type: new GraphQLObjectType({
        name: 'SimilarShortletPropertiesQuery',
        fields: {
          properties: { type: new GraphQLList(ShortletPropertyWithCursorType) },
          hasMore: { type: GraphQLBoolean },
        },
      }),
      args: {
        address: { type: GraphQLNonNull(GraphQLString) },
        listingType: { type: GraphQLNonNull(GraphQLString) },
        numberOfBedrooms: { type: GraphQLInt },
        cursor: { type: GraphQLString },
        limit: { type: GraphQLInt },
      },
      resolve: async (parent, { address, listingType, numberOfBedrooms, cursor, limit }) => {
        let query = {
          address,
          listingType,
          'propertyAttributes.numberOfBedrooms': numberOfBedrooms,
        };

        let similarShortletProperties = await ShortletProperty.find(query);

        if (cursor) {
          similarShortletProperties = similarShortletProperties.filter((property) => property._id > cursor);
        }

        similarShortletProperties.sort((a, b) => a._id - b._id);

        let hasMore = false;
        if (limit > 0) {
          similarShortletProperties = similarShortletProperties.slice(0, limit + 1);
          hasMore = similarShortletProperties.length > limit;
          if (hasMore) {
            similarShortletProperties = similarShortletProperties.slice(0, -1);
          }
        }

        return {
          properties: similarShortletProperties.map((property) => ({
            property,
            cursor: property._id.toString(),
          })),
          hasMore,
        };
      },
    },
  }),
});

const mutation = new GraphQLObjectType({
  name: 'MutationType',
  fields: () => ({
    createListing: {
      type: propertyType,
      description:
        "This mutation allows a user to create a new property listing. It requires several arguments: `userId` (mandatory), `listingType` (mandatory), `priceForRent`, `priceForBuy`, `address` (mandatory), `title` (mandatory), `favourite`, `street` (mandatory), `city` (mandatory), `state` (mandatory), `amenities`, `propertyImageList` (mandatory), `numberOfBedrooms` (mandatory), `numberOfGarages`, `yearBuilt`, `size`, `numberOfBathrooms` (mandatory), `propertyType` (mandatory), `numberOfFloors`, `roomSize`, `bathroomSize`, and `description` (mandatory). The mutation creates a new property with the provided details and adds it to the user's list of properties.",
      args: {
        userId: { type: GraphQLNonNull(GraphQLID) },
        listingType: { type: GraphQLNonNull(propertyListingEnumType) },
        priceForRent: { type: GraphQLInt },
        priceForBuy: { type: GraphQLInt },
        address: { type: GraphQLNonNull(GraphQLString) },
        title: { type: GraphQLNonNull(GraphQLString) },
        favourite: { type: GraphQLBoolean },
        street: { type: GraphQLNonNull(GraphQLString) },
        city: { type: GraphQLNonNull(GraphQLString) },
        state: { type: GraphQLNonNull(GraphQLString) },
        amenities: {
          type: new GraphQLList(AmenitiesInputType),
        },
        propertyImageList: { type: GraphQLNonNull(new GraphQLList(GraphQLString)) },
        numberOfBedrooms: {
          type: GraphQLNonNull(GraphQLInt),
        },
        numberOfGarages: {
          type: GraphQLInt,
        },
        yearBuilt: {
          type: GraphQLString,
        },
        size: {
          type: GraphQLString,
        },
        numberOfBathrooms: {
          type: GraphQLNonNull(GraphQLInt),
        },
        propertyType: {
          type: GraphQLNonNull(GraphQLString),
        },
        numberOfFloors: {
          type: GraphQLInt,
        },

        roomSize: {
          type: GraphQLString,
        },
        bathroomSize: {
          type: GraphQLString,
        },
        description: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        const { io } = context;
        const property = new Property({
          user: args.userId,
          listingType: args.listingType,
          priceForRent: args.priceForRent,
          priceForBuy: args.priceForBuy,
          address: args.address,
          title: args.title,
          amenities: args.amenities,
          favourite: args.favourite,

          propertyImageList: args.propertyImageList,
          detailedAddress: {
            street: args.street,
            city: args.city,
            state: args.state,
          },
          propertyAttributes: {
            propertyType: args.propertyType,
            numberOfGarages: args.numberOfGarages,
            numberOfBedrooms: args.numberOfBedrooms,
            numberOfBathrooms: args.numberOfBathrooms,
            size: args.size,
            yearBuilt: args.yearBuilt,
          },
          floorPlan: {
            roomSize: args.roomSize,
            bathroomSize: args.bathroomSize,
            numberOfFloors: args.numberOfFloors,
          },
          description: args.description,
        });
        const createdProperty = await property.save();

        await User.findByIdAndUpdate(args.userId, {
          $push: { properties: createdProperty._id },
        });

        const adminUserId = '664e3c342d09241e2cb93500';
        const adminUser = await User.findById(adminUserId);

        if (!adminUser) {
          throw new Error('Admin user not found');
        }
        const conversationId = `${'664e3c342d09241e2cb93500'}-${createdProperty.user._id}`;
        let messageDoc = await Message.findOne({ conversationId });
        if (!messageDoc) {
          messageDoc = new Message({ conversationId });
        }

        const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
        const listingDetailsPage = `${baseUrl}/${args.listingType}/listingdetails/${createdProperty._id}`;

        messageDoc.messages.push({
          userId: '664e3c342d09241e2cb93500',
          senderId: '664e3c342d09241e2cb93500',
          recipientId: `${createdProperty.user._id}`,
          text: ` Congratulations! 🎉 Your listing at ${args.address} has been successfully created. Click <a href="${listingDetailsPage}" style="color: blue; text-decoration: underline;">here</a> to view it now!`,
          listingId: '664e3c342d09241e2cb93500',
          name: 'Polis Admin',
          title: 'Listing Created',
          listingType: args.listingType,
          pic: 'https://lh3.googleusercontent.com/a/ACg8ocLTOjaa4pToPT6GtfXuJ2_sjN5AbhK8Y-X8ErQhCw7ePeIwSg=s96-c',
          senderEmail: 'polisng01@gmail.com',
        });
        await messageDoc.save();

        io.to(conversationId).emit('message', {
          conversationId,
          userId: '664e3c342d09241e2cb93500',
          senderId: '664e3c342d09241e2cb93500',
          recipientId: `${createdProperty.user._id}`,
          text: ` Congratulations! 🎉 Your listing at ${args.address} has been successfully created. Click <a href="${listingDetailsPage}" style="color: blue; text-decoration: underline;">here</a> to view it now!`,
          listingId: '664e3c342d09241e2cb93500',
          name: 'Polis Admin',
          title: 'Listing Created',
          listingType: args.listingType,
          pic: 'https://lh3.googleusercontent.com/a/ACg8ocLTOjaa4pToPT6GtfXuJ2_sjN5AbhK8Y-X8ErQhCw7ePeIwSg=s96-c',
          senderEmail: 'polisng01@gmail.com',
        });
        return createdProperty;
      },
    },

    updateProperty: {
      type: propertyType,
      description:
        'This mutation is used to update a property’s information. It requires one mandatory argument: `id`, which is the property’s ID. The other arguments (`listingType`, `priceForRent`, `priceForBuy`, `address`, `title`, `favourite`, `amenities`, `detailedAddress`, `propertyAttributes`, `floorPlan`, `propertyImageList`, `description`) are optional and represent the property’s information that can be updated. If the property with the provided id exists, the property’s information is updated accordingly. If propertyAttributes, detailedAddress, or floorPlan are provided, they are merged with the existing corresponding information. Other direct fields are updated if they are not undefined.',
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
        listingType: { type: propertyListingEnumType },
        priceForRent: { type: GraphQLInt },
        priceForBuy: { type: GraphQLInt },
        address: { type: GraphQLString },
        title: { type: GraphQLString },
        favourite: { type: GraphQLBoolean },
        status: { type: GraphQLString },
        amenities: {
          type: new GraphQLList(AmenitiesInputType),
        },
        detailedAddress: {
          type: detailedAddressInputType,
        },
        propertyAttributes: {
          type: propertyAttributesInputType,
        },
        floorPlan: {
          type: floorPlanInputType,
        },
        propertyImageList: { type: new GraphQLList(GraphQLString) },

        description: { type: GraphQLString },
      },
      resolve: async (parent, { id, ...args }, context) => {
        let property = await Property.findById(id);

        if (!property) {
          throw new Error(`Property with ID ${id} not found.`);
        }

        if (args.propertyAttributes) {
          property.propertyAttributes = {
            ...property.propertyAttributes,
            ...args.propertyAttributes,
          };
        }

        if (args.detailedAddress) {
          property.detailedAddress = {
            ...property.detailedAddress,
            ...args.detailedAddress,
          };
        }

        if (args.floorPlan) {
          property.floorPlan = {
            ...property.floorPlan,
            ...args.floorPlan,
          };
        }

        // Update other direct fields
        for (let prop in args) {
          if (prop !== 'propertyAttributes' && prop !== 'detailedAddress' && prop !== 'floorPlan') {
            if (args[prop] !== undefined) {
              property[prop] = args[prop];
            }
          }
        }

        return await property.save();
      },
    },

    addToWishlist: {
      type: userType,
      description:
        'This mutation is used to add a property to a user’s wishlist. It requires two mandatory arguments: `userId`, which is the user’s ID, and `propertyId`, which is the ID of the property to be added. If the user with the provided `userId` exists and the property with the provided `propertyId` is not already in the user’s wishlist, the property is added to the wishlist.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        propertyId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, { userId, propertyId }) => {
        try {
          const user = await User.findById(userId);
          if (!user) {
            throw new Error('User not found.');
          }

          const isAlreadyInWishlist = user.wishlist.some((item) => item.property?.toString() === propertyId);

          if (!isAlreadyInWishlist) {
            user.wishlist.push({ property: propertyId, dateAdded: new Date() });
          }

          const property = await Property.findById(propertyId);
          if (property) {
            // property.favourite = true;
            await property.save();
          }

          await user.save();
          return user;
        } catch (error) {
          throw new Error(error.message);
        }
      },
    },
    addToShortletWishlist: {
      type: userType,
      description: 'This mutation adds a shortlet listing to a user’s shortlet wishlist.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        shortletId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, { userId, shortletId }) => {
        try {
          const user = await User.findById(userId);
          if (!user) {
            throw new Error('User not found.');
          }

          const isAlreadyInWishlist = user.shortletWishlist.some((item) => item.shortlet.toString() === shortletId);

          if (!isAlreadyInWishlist) {
            user.shortletWishlist.push({ shortlet: shortletId });
            await user.save();
          }

          return user;
        } catch (error) {
          throw new Error(error.message);
        }
      },
    },
    // addToWishlist: {
    //   type: userType,
    //   description:
    //     'This mutation is used to add a property to a user’s wishlist. It requires two mandatory arguments: `userId`, which is the user’s ID, and `propertyId`, which is the ID of the property to be added. If the user with the provided `userId` exists and the property with the provided `propertyId` is not already in the user’s wishlist, the property is added to the wishlist.',
    //   args: {
    //     userId: { type: GraphQLNonNull(GraphQLString) },
    //     propertyId: { type: GraphQLNonNull(GraphQLString) },
    //   },
    //   resolve: async (parent, { userId, propertyId }) => {
    //     try {
    //       const user = await User.findById(userId);
    //       if (!user) {
    //         throw new Error('User not found.');
    //       }

    //       const isAlreadyInWishlist = user.wishlist.includes(propertyId);

    //       if (!isAlreadyInWishlist) {
    //         user.wishlist.push(propertyId);
    //       }

    //       const property = await Property.findById(propertyId);
    //       if (property) {
    //         // property.favourite = true;
    //         await property.save();
    //       }

    //       await user.save();
    //       return user;
    //     } catch (error) {
    //       throw new Error(error.message);
    //     }
    //   },
    // },

    // removeFromWishList: {
    //   type: userType,
    //   description:
    //     'This mutation is used to remove a property from a user’s wishlist. It requires two mandatory arguments: `userId`, which is the user’s ID, and `propertyId`, which is the ID of the property to be removed. If the user with the provided `userId` exists and the property with the provided `propertyId` is in the user’s wishlist, the property is removed from the wishlist.',
    //   args: {
    //     userId: { type: GraphQLNonNull(GraphQLString) },
    //     propertyId: { type: GraphQLNonNull(GraphQLString) },
    //   },
    //   resolve: async (parent, { userId, propertyId }, context) => {
    //     try {
    //       const user = await User.findById(userId);
    //       if (!user) {
    //         throw new Error(`User with ID ${userId} not found.`);
    //       }

    //       const propertyIndex = user.wishlist.indexOf(propertyId);
    //       if (propertyIndex === -1) {
    //         throw new Error(`Property with ID ${propertyId} not found in user's wish list.`);
    //       }

    //       user.wishlist.splice(propertyIndex, 1);

    //       const property = await Property.findById(propertyId);
    //       if (property) {
    //         // property.favourite = false;
    //         await property.save();
    //       }

    //       await user.save();
    //       return user;
    //     } catch (error) {
    //       throw new Error(error.message);
    //     }
    //   },
    // },

    removeFromWishList: {
      type: userType,
      description:
        'This mutation is used to remove a property from a user’s wishlist. It requires two mandatory arguments: `userId`, which is the user’s ID, and `propertyId`, which is the ID of the property to be removed. If the user with the provided `userId` exists and the property with the provided `propertyId` is in the user’s wishlist, the property is removed from the wishlist.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        propertyId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, { userId, propertyId }, context) => {
        try {
          const user = await User.findById(userId);
          if (!user) {
            throw new Error(`User with ID ${userId} not found.`);
          }

          const propertyIndex = user.wishlist.findIndex((item) => item.property.toString() === propertyId);

          if (propertyIndex === -1) {
            throw new Error(`Property with ID ${propertyId} not found in user's wish list.`);
          }

          user.wishlist.splice(propertyIndex, 1);

          const property = await Property.findById(propertyId);
          if (property) {
            // property.favourite = false;
            await property.save();
          }

          await user.save();
          return user;
        } catch (error) {
          throw new Error(error.message);
        }
      },
    },
    removeFromShortletWishlist: {
      type: userType,
      description:
        'This mutation is used to remove a shortlet listing from a user’s shortlet wishlist. It requires two mandatory arguments: `userId`, which is the user’s ID, and `shortletId`, which is the ID of the shortlet listing to be removed. If the user with the provided `userId` exists and the shortlet listing with the provided `shortletId` is in the user’s shortlet wishlist, the listing is removed from the wishlist.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        shortletId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, { userId, shortletId }, context) => {
        try {
          const user = await User.findById(userId);
          if (!user) {
            throw new Error(`User with ID ${userId} not found.`);
          }

          const shortletIndex = user.shortletWishlist.findIndex((item) => item.shortlet.toString() === shortletId);

          if (shortletIndex === -1) {
            throw new Error(`Shortlet listing with ID ${shortletId} not found in user's shortlet wishlist.`);
          }

          user.shortletWishlist.splice(shortletIndex, 1);

          await user.save();
          return user;
        } catch (error) {
          throw new Error(error.message);
        }
      },
    },

    updateSearch: {
      type: SearchType,
      description:
        'This mutation is used to update a user’s recent searches. It requires two mandatory arguments: `userId`, which is the user’s ID, and `newSearch`, which is the new search to be added. The new search is added to the user’s recent searches, and the list is trimmed to the last five searches.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        newSearch: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { userId, newSearch }) => {
        return await RecentSearch.findOneAndUpdate(
          { userId },
          { $push: { searches: { $each: [newSearch], $slice: -5 } } },
          { new: true, upsert: true },
        );
      },
    },

    deleteSearch: {
      type: SearchType,
      description:
        ' This mutation is used to delete a user’s recent searches. It requires one mandatory argument: `userId`, which is the user’s ID. All of the user’s recent searches are deleted.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { userId }) => {
        await RecentSearch.findOneAndDelete({ userId });
        return null;
      },
    },

    registerUser: {
      type: userType,
      description:
        'This mutation is used to register a new user. It requires `name`, `email`, and `password` as mandatory arguments. If the email is not already registered, a new user is created, and a JWT token is generated.',
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        const { email, password, name } = args;

        const userExists = await User.findOne({ email });
        if (userExists) throw new Error('Email already registered.');

        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        if (!/[a-z]/.test(password)) {
          throw new Error('Password must contain at least one lowercase letter.');
        }
        if (!/[A-Z]/.test(password)) {
          throw new Error('Password must contain at least one uppercase letter.');
        }
        if (!/[0-9\s\W]/.test(password)) {
          throw new Error('Password must contain at least one number, symbol, or whitespace character.');
        }

        // Create a JWT token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, {
          expiresIn: '1h',
        });

        // Create a new user
        const user = new User({
          email,
          password,
          name,
        });
        await user.save();

        const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
        const verifyEmailLink = `${baseUrl}/verify-email?token=${token}&email=${email}`;
        let expirationTime = '1 hour';
        //<---------- email options ---------->

        const mail = {
          From: 'admin@polis.ng',
          To: email,
          Subject: 'Email Verification: Please verify your email address',
          HtmlBody: EMAIL_VERIFICATION_TEMPLATE(verifyEmailLink, user.name, expirationTime),
        };

        try {
          const result = await client.sendEmail(mail);
          console.log(result);
        } catch (error) {
          console.error(error);
        }

        return user;
      },
    },

    requestEmailVerification: {
      type: GraphQLString,
      description:
        "This mutation is used to request the email verification for a user. It requires one mandatory argument: `email`. The `email` is the user's email address. If the email exists in the system, an email verification is sent to the user.",
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        const { email } = args;
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('User not found');
        }
        if (user.verified) {
          return 'Your email address has already been verified';
        }

        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, {
          expiresIn: '1h',
        });
        const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
        const verifyEmailLink = `${baseUrl}/verify-email?token=${resetToken}&email=${email}`;
        let expirationTime = '1 hour';
        //<---------- email options ---------->
        const mail = {
          From: 'admin@polis.ng',
          To: email,
          Subject: 'Resend: Verify Your Email Address',
          HtmlBody: EMAIL_VERIFICATION_TEMPLATE(verifyEmailLink, user.name, expirationTime),
        };

        try {
          const result = await client.sendEmail(mail);
          console.log(result);
        } catch (error) {
          console.error(error);
          throw new Error('Failed to resend the email verification.');
        }
        return 'The email verification link has been successfully resent';
      },
    },

    verifyEmail: {
      type: GraphQLString,
      description:
        "This mutation is used to verify a user's email. It requires two mandatory arguments: `email` and `token`. The `email` is the user's email address that needs to be verified. The `token` is a unique string that was sent to the user's email for verification purposes.",
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        token: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        const { email, token } = args;

        try {
          const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
          if (decodedToken.email !== email) {
            throw new Error('Invalid token');
          }

          const user = await User.findOneAndUpdate({ email }, { verified: true }, { new: true });

          if (!user) {
            throw new Error('User not found');
          }

          return 'Email verification successful';
        } catch (error) {
          console.error('Error verifying email:', error);
          throw new Error('An error occurred while verifying email');
        }
      },
    },

    loginUser: {
      type: GraphQLString,
      description:
        "This mutation is used to log a user into the system. It requires two mandatory arguments: `email` and `password`. The `email` is the user's email address and the `password` is the user's password. If the email and password match a user in the system and the user's email has been verified, a token is returned that can be used for authenticated requests.",
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: async (parent, args, context) => {
        console.log({ context });
        const { email, password } = args;
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('Incorrect email address or password');
        }

        if (user.verified === false) {
          throw new Error('Email address not verified');
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
          throw new Error('Invalid email or password');
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

        return token;
      },
    },

    loginWithGoogle: {
      type: GraphQLString,
      args: {
        idToken: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_ID);
        const { idToken } = args;

        const ticket = await client.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_ID, // Specify the CLIENT_ID of the app that accesses the backend
        });

        const payload = ticket.getPayload();
        const userid = payload['sub'];
        // If request specified a G Suite domain:
        // const domain = payload['hd'];

        // You can also access basic profile info
        const name = payload['name'];
        const email = payload['email'];

        // Check if the user already exists in your database
        let user = await User.findOne({ email });

        if (!user) {
          // If the user doesn't exist, create a new user
          user = new User({
            email,
            name,
            verified: true,
            createdAt: new Date(),
          });

          await user.save();
        }

        // Sign a JWT token and return it
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

        return token;
      },
    },

    sendEmail: {
      type: GraphQLString,
      description:
        "This mutation is used to send an email. It requires three mandatory arguments: `email`, `subject`, and `body`. The `email` is the recipient's email address. The `subject` is the subject line of the email. The `body` is the main content of the email.",
      args: {
        email: { type: GraphQLNonNull(GraphQLString) },
        subject: { type: GraphQLNonNull(GraphQLString) },
        body: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, { email, subject, body }) => {
        const mail = {
          From: 'admin@polis.ng',
          To: email,
          Subject: subject,
          HtmlBody: body,
        };
        try {
          const result = await client.sendEmail(mail);
          console.log(result);
        } catch (error) {
          console.error(error);
          throw new Error('Error sending email');
        }
      },
    },

    subscribeToNewsletter: {
      type: GraphQLString,
      description:
        "This mutation is used to subscribe a user to a newsletter. It requires one mandatory argument: `email`. The `email` is the user's email address. If the email is not already subscribed to the newsletter, it is added to the subscription list and a confirmation email is sent.",
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        const { email } = args;
        const existingSubscription = await NewsletterSubscription.findOne({
          email,
        });
        if (existingSubscription) {
          return 'You are already subscribed to our newsletter.';
        }

        await NewsletterSubscription.create({ email });

        const confirmationMessage = `
        Thank you for joining our newsletter! We’ll be in touch with some tips and premium content, watch this space!
      `;

        const mail = {
          From: 'admin@polis.ng',
          To: email,
          Subject: 'Newsletter Subscription Confirmation',
          HtmlBody: NEWSLETTER_SUBSCRIPTION_CONFIRMATION_TEMPLATE(confirmationMessage),
        };

        try {
          const result = await client.sendEmail(mail);
          console.log(result);
        } catch (error) {
          console.error(error);
          throw new Error('Failed to send password reset email');
        }

        return 'A confirmation email has been sent.';
      },
    },

    uploadImageFiles: {
      type: GraphQLList(GraphQLString),
      description:
        'This mutation is used to upload multiple image files. It requires two mandatory arguments: `dataUrls` and `fileNames`. The `dataUrls` is a list of data URLs of the images to be uploaded. The `fileNames` is a list of names to be assigned to the uploaded files. The mutation returns a list of URLs of the uploaded images.',
      args: {
        dataUrls: { type: GraphQLNonNull(GraphQLList(GraphQLString)) },
        fileNames: { type: GraphQLNonNull(GraphQLList(GraphQLString)) },
      },
      resolve: async (_, { dataUrls, fileNames }) => {
        try {
          const b2 = new B2({
            applicationKeyId: process.env.BACKBLAZE_APPLICATION_KEYID,
            applicationKey: process.env.BACKBLAZE_APPLICATION_KEY,
          });

          const { data: authData } = await b2.authorize();
          const { data: bucketsData } = await b2.listBuckets();
          const bucket = bucketsData.buckets.find((bucket) => bucket.bucketId === '9110f4e6a7f3eeb48d7b0615');

          const bucketName = bucket.bucketName;
          const { data: uploadData } = await b2.getUploadUrl({
            bucketId: process.env.BACKBLAZE_BUCKETID,
          });

          const urls = [];

          for (let i = 0; i < dataUrls.length; i++) {
            const dataUrl = dataUrls[i];
            const fileName = fileNames[i];

            const data = Buffer.from(dataUrl.split(',')[1], 'base64');

            const { data: uploadResponse } = await b2.uploadFile({
              uploadUrl: uploadData.uploadUrl,
              uploadAuthToken: uploadData.authorizationToken,
              data,
              fileName,
            });

            const downloadURL = authData.downloadUrl;
            urls.push(`${downloadURL}/file/${bucketName}/${uploadResponse.fileName}`);
          }

          return urls;
        } catch (error) {
          console.error('Image upload error', error);
          throw new Error('Image upload error');
        }
      },
    },

    requestPasswordReset: {
      type: GraphQLString,
      description:
        "This mutation is used to request a password reset for a user. It requires one mandatory argument: `email`. The `email` is the user's email address. If the email exists in the system, a password reset email is sent to the user.",
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        const { email } = args;

        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('User not found');
        }

        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, {
          expiresIn: '1h',
        });

        const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
        const resetLink = `${baseUrl}/password-reset?token=${resetToken}&email=${email}`;

        const mail = {
          From: 'admin@polis.ng',
          To: email,
          Subject: 'Password Reset',
          HtmlBody: PASSWORD_RESET_TEMPLATE(resetLink),
        };

        try {
          const result = await client.sendEmail(mail);
          console.log(result);
        } catch (error) {
          console.error(error);
          throw new Error('Failed to send password reset email');
        }

        return 'Password reset email sent';
      },
    },

    resetPassword: {
      type: GraphQLString,
      description:
        "This mutation is used to reset a user's password. It requires three mandatory arguments: `email`, `password`, and `confirmPassword`. The `email` is the user's email address. The `password` is the new password. The `confirmPassword` is the confirmation of the new password.",
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        confirmPassword: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args) => {
        const { email, password, confirmPassword } = args;

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const updatedUser = await User.findOneAndUpdate({ email }, { password: hash }, { new: true });

        if (!updatedUser) {
          throw new Error('User not found');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        return 'Password reset successfully';
      },
    },

    changePassword: {
      type: GraphQLString,
      description:
        'This mutation allows a logged-in user to change their password. It requires the current password, new password, and confirm password.',
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        currentPassword: { type: new GraphQLNonNull(GraphQLString) },
        newPassword: { type: new GraphQLNonNull(GraphQLString) },
        confirmPassword: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, { user }) => {
        const { email, currentPassword, newPassword, confirmPassword } = args;

        const userRecord = await User.findOne({ email });
        if (!userRecord) {
          throw new Error('User not found');
        }

        const isMatch = await bcrypt.compare(currentPassword, userRecord.password);
        if (!isMatch) {
          throw new Error('Current password is incorrect');
        }

        if (newPassword !== confirmPassword) {
          throw new Error('New password and confirm password do not match');
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        userRecord.password = hash;
        await userRecord.save();

        return 'Password changed successfully';
      },
    },

    updateUser: {
      type: userType,
      description:
        'This mutation is used to update a user’s information. It requires several arguments, which are ( `id` (mandatory), name` (mandatory), `email` (mandatory), `role`, `gender`, `dateOfBirth` (mandatory), `address` (mandatory), `about`, `phoneNumber` (mandatory), `profilePictureUrl`, `website`) these arguments represent the user’s information that can be updated. If the user with the provided id exists, the user’s information is updated accordingly.',
      args: {
        id: { type: GraphQLNonNull(GraphQLString) },
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        role: { type: userRoleEnumType },
        gender: { type: genderEnumType },
        dateOfBirth: { type: GraphQLString },
        address: { type: GraphQLString },
        about: { type: GraphQLString },
        phoneNumber: { type: GraphQLString },
        profilePictureUrl: { type: GraphQLString },
        website: { type: GraphQLString },
      },
      resolve: async (parent, { id, ...args }, context) => {
        // checkAuth(context, id, 'You can only update your profile');

        let user = await User.findById(id);

        if (!user) {
          throw new Error(`Property with ID ${id} not found.`);
        }

        for (let prop in args) {
          if (args[prop] !== undefined) {
            user[prop] = args[prop];
          }
        }

        return await user.save();
      },
    },

    logoutUser: {
      type: GraphQLString,
      description:
        'This mutation is used to log out a user. It does not require any arguments. When invoked, it returns a success message.',
      resolve: (parent, args, context) => {
        context.currentUser = null;
        return 'Logout success';
      },
    },

    deleteUserAccount: {
      type: GraphQLString,
      description:
        'This mutation is used to delete a user’s account. It requires one mandatory argument: `userId`, which is the ID of the user to be deleted. If the user with the provided `userId` exists, the user’s account and associated properties are deleted. A confirmation email is then sent to the user’s email address.',
      args: {
        userId: { type: GraphQLNonNull(GraphQLID) },
      },
      resolve: async (parent, { userId }, context) => {
        try {
          const user = await User.findById(userId);
          if (!user) {
            throw new Error(`User with ID ${userId} not found.`);
          }

          const propertyIds = user.properties;

          await Property.deleteMany({ _id: { $in: propertyIds } });

          await User.findByIdAndDelete(userId);

          const mail = {
            From: 'admin@polis.ng',
            To: user.email,
            Subject: 'Account Deletion Confirmation',
            HtmlBody: ACCOUNT_DELETION_CONFIRMATION_TEMPLATE(),
          };

          try {
            const result = await client.sendEmail(mail);
            console.log(result);
          } catch (error) {
            console.error(error);
            throw new Error('Failed to send deletion confirmation email ');
          }

          return 'User account and associated properties have been successfully deleted.';
        } catch (error) {
          throw new Error(error.message);
        }
      },
    },

    deletePropertyImage: {
      type: propertyType,
      description:
        ' This mutation is used to delete an image from a property’s image list. It requires two mandatory arguments: `id`, which is the property’s ID, and `imageIndex`, which is the index of the image in the property’s image list. If the property with the provided `id` exists and the `imageIndex` is valid, the image at the specified index is removed from the property’s image list.',
      args: {
        id: { type: GraphQLNonNull(GraphQLString) },
        imageIndex: { type: GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (parent, { id, imageIndex }, context) => {
        let property = await Property.findById(id);

        if (!property) {
          throw new Error(`Property with ID ${id} not found.`);
        }

        if (imageIndex < 0 || imageIndex >= property.propertyImageList.length) {
          throw new Error('Invalid image index.');
        }

        // Remove the image at the specified index
        property.propertyImageList.splice(imageIndex, 1);

        return await property.save();
      },
    },

    deleteProperty: {
      type: userType,
      description:
        "This mutation allows a user to delete a property. It requires two mandatory arguments: `propertyId` and `userId`. The `propertyId` is the ID of the property to be deleted. The `userId` is the ID of the user who owns the property. The mutation checks if the property exists and if the user is authorized to delete it. If both conditions are met, the property is deleted and the user's list of properties is updated.",
      args: {
        propertyId: { type: GraphQLNonNull(GraphQLString) },
        userId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, { propertyId, userId }) => {
        try {
          const property = await Property.findById(propertyId);
          if (!property) {
            throw new Error('Property not found.');
          }

          if (property.user.toString() !== userId) {
            throw new Error('You are not authorized to delete this property.');
          }

          await Property.findByIdAndDelete(propertyId);

          const user = await User.findById(userId);
          if (!user) {
            throw new Error('User not found.');
          }

          user.properties = user.properties.filter((propId) => propId.toString() !== propertyId);
          await user.save();

          return user; // Return the updated user object
        } catch (error) {
          throw new Error(error.message);
        }
      },
    },

    createShortletListing: {
      type: shortletPropertyType,
      description:
        "This mutation allows a user to create a new property listing. It requires several arguments: `userId` (mandatory), `listingType` (mandatory), `priceForRent`, `priceForBuy`, `address` (mandatory), `title` (mandatory), `favourite`, `street` (mandatory), `city` (mandatory), `state` (mandatory), `amenities`, `propertyImageList` (mandatory), `numberOfBedrooms` (mandatory), `numberOfGarages`, `yearBuilt`, `size`, `numberOfBathrooms` (mandatory), `propertyType` (mandatory), `numberOfFloors`, `roomSize`, `bathroomSize`, and `description` (mandatory). The mutation creates a new property with the provided details and adds it to the user's list of properties.",
      args: {
        userId: { type: GraphQLNonNull(GraphQLID) },
        listingType: { type: GraphQLNonNull(propertyListingEnumType) },
        pricePerNight: { type: GraphQLInt },
        address: { type: GraphQLNonNull(GraphQLString) },
        title: { type: GraphQLNonNull(GraphQLString) },
        favourite: { type: GraphQLBoolean },
        street: { type: GraphQLNonNull(GraphQLString) },
        city: { type: GraphQLNonNull(GraphQLString) },
        state: { type: GraphQLNonNull(GraphQLString) },
        amenities: {
          type: new GraphQLList(AmenitiesInputType),
        },
        cancellationPolicy: { type: GraphQLString },
        timeLimit: { type: GraphQLString },
        checkInAfter: { type: GraphQLString },
        checkOutBefore: { type: GraphQLString },
        specialNotes: {
          type: new GraphQLList(SpecialNoteInputType),
        },
        instantBooking: { type: GraphQLBoolean },
        propertyImageList: { type: GraphQLNonNull(new GraphQLList(GraphQLString)) },
        numberOfBedrooms: {
          type: GraphQLNonNull(GraphQLInt),
        },
        numberOfGarages: {
          type: GraphQLInt,
        },
        yearBuilt: {
          type: GraphQLString,
        },
        size: {
          type: GraphQLString,
        },
        numberOfBathrooms: {
          type: GraphQLNonNull(GraphQLInt),
        },
        numberOfGuests: {
          type: GraphQLNonNull(GraphQLInt),
        },
        propertyType: {
          type: GraphQLNonNull(GraphQLString),
        },
        numberOfFloors: {
          type: GraphQLInt,
        },
        roomSize: {
          type: GraphQLString,
        },
        bathroomSize: {
          type: GraphQLString,
        },
        description: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        const { io } = context;
        const property = new ShortletProperty({
          user: args.userId,
          listingType: args.listingType,
          pricePerNight: args.pricePerNight,
          address: args.address,
          title: args.title,
          instantBooking: args.instantBooking,
          amenities: args.amenities,
          favourite: args.favourite,
          propertyImageList: args.propertyImageList,
          thingsToKnow: {
            timeLimit: args.timeLimit,
            cancellationPolicy: args.cancellationPolicy,
            checkInAfter: args.checkInAfter,
            checkOutBefore: args.checkOutBefore,
            specialNotes: args.specialNotes,
          },
          detailedAddress: {
            street: args.street,
            city: args.city,
            state: args.state,
          },
          propertyAttributes: {
            propertyType: args.propertyType,
            numberOfGarages: args.numberOfGarages,
            numberOfBedrooms: args.numberOfBedrooms,
            numberOfGuests: args.numberOfGuests,
            numberOfBathrooms: args.numberOfBathrooms,
            size: args.size,
            yearBuilt: args.yearBuilt,
          },
          floorPlan: {
            roomSize: args.roomSize,
            bathroomSize: args.bathroomSize,
            numberOfFloors: args.numberOfFloors,
          },
          description: args.description,
        });
        const createdShortletProperty = await property.save();

        const adminUserId = '664e3c342d09241e2cb93500';
        const adminUser = await User.findById(adminUserId);

        if (!adminUser) {
          throw new Error('Admin user not found');
        }

        // Create or find the conversation between the user and the admin
        const conversationId = `${'664e3c342d09241e2cb93500'}-${createdShortletProperty.user._id}`;
        let messageDoc = await Message.findOne({ conversationId });
        if (!messageDoc) {
          messageDoc = new Message({ conversationId });
        }

        const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
        const listingDetailsPage = `${baseUrl}/${args.listingType}/listingdetails/${createdShortletProperty._id}`;

        // Push the new message to the conversation
        messageDoc.messages.push({
          userId: '664e3c342d09241e2cb93500',
          senderId: '664e3c342d09241e2cb93500',
          recipientId: `${createdShortletProperty.user._id}`,
          text: ` Congratulations! 🎉 Your listing at ${args.address} has been successfully created. Click <a href="${listingDetailsPage}" style="color: blue; text-decoration: underline;">here</a> to view it now!`,
          listingId: '664e3c342d09241e2cb93500',
          name: 'Polis Admin',
          title: 'Listing Created',
          listingType: args.listingType,
          pic: 'https://lh3.googleusercontent.com/a/ACg8ocLTOjaa4pToPT6GtfXuJ2_sjN5AbhK8Y-X8ErQhCw7ePeIwSg=s96-c',
          senderEmail: 'polisng01@gmail.com',
        });
        await messageDoc.save();

        // Emit the message to the conversation
        io.to(conversationId).emit('message', {
          conversationId,
          userId: '664e3c342d09241e2cb93500',
          senderId: '664e3c342d09241e2cb93500',
          recipientId: `${createdShortletProperty.user._id}`,
          text: ` Congratulations! 🎉 Your listing at ${args.address} has been successfully created. Click <a href="${listingDetailsPage}" style="color: blue; text-decoration: underline;">here</a> to view it now!`,
          listingId: '664e3c342d09241e2cb93500',
          name: 'Polis Admin',
          title: 'Listing Created',
          listingType: args.listingType,
          pic: 'https://lh3.googleusercontent.com/a/ACg8ocLTOjaa4pToPT6GtfXuJ2_sjN5AbhK8Y-X8ErQhCw7ePeIwSg=s96-c',
          senderEmail: 'polisng01@gmail.com',
        });
        return createdShortletProperty;
      },
    },

    updateShortletProperty: {
      type: shortletPropertyType,
      description:
        'This mutation is used to update a shortlet property’s information. It requires one mandatory argument: `id`, which is the shortlet property’s ID. The other arguments (`listingType`, `priceForRent`, `priceForBuy`, `address`, `title`, `favourite`, `amenities`, `detailedAddress`, `propertyAttributes`, `floorPlan`, `propertyImageList`, `description`) are optional and represent the property’s information that can be updated. If the property with the provided id exists, the property’s information is updated accordingly. If propertyAttributes, detailedAddress, or floorPlan are provided, they are merged with the existing corresponding information. Other direct fields are updated if they are not undefined.',
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
        listingType: { type: propertyListingEnumType },
        address: { type: GraphQLString },
        title: { type: GraphQLString },
        favourite: { type: GraphQLBoolean },
        status: { type: GraphQLString },
        amenities: {
          type: new GraphQLList(AmenitiesInputType),
        },
        detailedAddress: {
          type: detailedAddressInputType,
        },
        propertyAttributes: {
          type: propertyAttributesInputType,
        },
        thingsToKnow: { type: thingsToKnowInputType },
        floorPlan: {
          type: floorPlanInputType,
        },
        propertyImageList: { type: new GraphQLList(GraphQLString) },

        description: { type: GraphQLString },
      },
      resolve: async (parent, { id, ...args }, context) => {
        let shortletProperty = await ShortletProperty.findById(id);
        if (!shortletProperty) {
          throw new Error(`Property not found.`);
        }

        if (args.propertyAttributes) {
          shortletProperty.propertyAttributes = {
            ...shortletProperty.propertyAttributes,
            ...args.propertyAttributes,
          };
        }

        if (args.detailedAddress) {
          shortletProperty.detailedAddress = {
            ...shortletProperty.detailedAddress,
            ...args.detailedAddress,
          };
        }

        if (args.floorPlan) {
          shortletProperty.floorPlan = {
            ...shortletProperty.floorPlan,
            ...args.floorPlan,
          };
        }
        if (args.thingsToKnow) {
          shortletProperty.thingsToKnow = lodash.merge(shortletProperty.thingsToKnow, args.thingsToKnow);
        }

        // Update other direct fields
        for (let prop in args) {
          if (
            prop !== 'propertyAttributes' &&
            prop !== 'detailedAddress' &&
            prop !== 'floorPlan' &&
            prop !== 'thingsToKnow'
          ) {
            if (args[prop] !== undefined) {
              shortletProperty[prop] = args[prop];
            }
          }
        }

        return await shortletProperty.save();
      },
    },

    createBooking: {
      type: BookingType,
      args: {
        userId: { type: GraphQLNonNull(GraphQLID) },
        propertyId: { type: GraphQLNonNull(GraphQLID) },
        startDate: { type: GraphQLNonNull(GraphQLString) },
        endDate: { type: GraphQLNonNull(GraphQLString) },
        numberOfGuests: { type: GraphQLNonNull(GraphQLInt) },
        numberOfNights: { type: GraphQLInt },
        serviceCharge: { type: GraphQLInt },
        costForNights: { type: GraphQLInt },
        totalCost: { type: GraphQLInt },
        averageRating: { type: GraphQLFloat },
        totalReviews: { type: GraphQLInt },
        enablePayment: { type: GraphQLNonNull(GraphQLBoolean) },
      },
      resolve: async (parent, args, context) => {
        let startDate = args.startDate.split('/').reverse().join('/');
        let endDate = args.endDate.split('/').reverse().join('/');
        const property = await ShortletProperty.findById(args.propertyId);
        let bookingProperties = {};

        if (property.instantBooking) {
          const isPropertyAvailable = await checkPropertyAvailability({ property, startDate, endDate });
          if (!isPropertyAvailable) {
            throw new Error('Booking unavailable for this date');
          }
        } else {
          //<-------- check for clash -------->
          try {
            `The conflicting requests is meant to return only one value if a clash occurs. The
            reason is because we are only checking the clash against the bookings whose enable payment
            is true and the isActive field is false. Normally when a clash has been taken care of from the update approval requests,
            the main approval request is approved, the enable payment of the booking is set to true, the isActive state is made false
            and all of its conflicting requests are made inactive too.
            `;
            const conflictingRequests = await checkBookingDateClash({
              propertyId: property._id,
              enablePayment: true,
              isActive: false,
              startDate,
              endDate,
            });
            if (conflictingRequests.length === 1) {
              bookingProperties.isActive = false;
              bookingProperties.linkedBooking = conflictingRequests[0].booking._id;
            }
          } catch (error) {
            throw new Error(error);
          }
        }
        const booking = new Booking({
          user: args.userId,
          property: args.propertyId,
          startDate,
          endDate,
          numberOfGuests: args.numberOfGuests,
          numberOfNights: args.numberOfNights,
          serviceCharge: args.serviceCharge,
          costForNights: args.costForNights,
          totalCost: args.totalCost,
          averageRating: args.averageRating,
          totalReviews: args.totalReviews,
          enablePayment: args.enablePayment,
          ...bookingProperties,
        });
        const createdBooking = await booking.save();

        return createdBooking;
      },
    },

    removeBookingDate: {
      type: shortletPropertyType,
      args: {
        propertyId: { type: GraphQLNonNull(GraphQLID) },
        startDate: { type: GraphQLNonNull(GraphQLString) },
        endDate: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        // Find the property
        const property = await ShortletProperty.findById(args.propertyId);
        if (!property) {
          throw new Error(`Property with ID ${args.propertyId} not found.`);
        }

        // Convert args dates to Date objects
        const argStartDate = new Date(args.startDate);
        const argEndDate = new Date(args.endDate);

        // Remove the booking from the bookedDates array
        property.bookedDates = property.bookedDates.filter(
          (booking) =>
            !(
              new Date(booking.startDate).getTime() === argStartDate.getTime() &&
              new Date(booking.endDate).getTime() === argEndDate.getTime()
            ),
        );

        // Save the updated property
        await property.save();

        return property;
      },
    },

    updateInstantBooking: {
      type: shortletPropertyType,
      description:
        'This mutation is used to update the instant booking status of a shortlet property. It requires two mandatory arguments: `propertyId`, which is the ID of the shortlet property, and `instantBooking`, which is the new value for the instant booking status.',
      args: {
        propertyId: { type: GraphQLNonNull(GraphQLID) },
        instantBooking: { type: GraphQLNonNull(GraphQLBoolean) },
      },
      resolve: async (_, { propertyId, instantBooking }) => {
        return await ShortletProperty.findByIdAndUpdate(propertyId, { instantBooking }, { new: true });
      },
    },

    addReview: {
      type: AddReviewType,
      args: {
        reviewer: { type: GraphQLNonNull(GraphQLID) },
        propertyId: { type: GraphQLNonNull(GraphQLID) },
        rating: { type: GraphQLNonNull(GraphQLInt) },
        comment: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        // Check if the user has booked and checked out of the property
        const booking = await Booking.findOne({
          user: args.reviewer,
          property: args.propertyId,
        });

        if (!booking) {
          throw new Error('Only users who have booked the property can leave a review.');
        }

        // Check if the current date is on or after the booking's endDate
        const currentDate = new Date();
        const bookingEndDate = new Date(booking.endDate);
        if (currentDate < bookingEndDate) {
          throw new Error('You can only leave a review on or after the end date of your booking.');
        }

        // Check if the current time is after the property's checkOutTime
        if (currentDate === bookingEndDate) {
          const property = await ShortletProperty.findById(args.propertyId);
          const checkOutTime = property.thingsToKnow.checkOutBefore;
          const currentHour = currentDate.getHours();
          const checkOutHour = parseInt(checkOutTime.split(':')[0]);
          if (currentHour < checkOutHour) {
            throw new Error('You can only leave a review after the check-out time.');
          }
        }

        const review = new Review({
          user: args.reviewer,
          property: args.propertyId,
          rating: args.rating,
          comment: args.comment,
        });
        const savedReview = await review.save();
        const property = await ShortletProperty.findById(args.propertyId);

        property.reviews.push(savedReview);
        await property.calculateRatings();

        await property.save();

        return savedReview;
      },
    },

    blockDates: {
      type: BlockUnblockPropertyType,
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        propertyId: { type: GraphQLNonNull(GraphQLString) },
        startDate: { type: GraphQLNonNull(GraphQLString) },
        endDate: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        try {
          const startDate = new Date(args.startDate.split('/').reverse().join('-'));
          const endDate = new Date(args.endDate.split('/').reverse().join('-'));

          const property = await ShortletProperty.findById(args.propertyId);

          if (!property) {
            throw new Error('Property not found.');
          }

          // Check if the user is the host of the property
          if (property.user.toString() !== args.userId) {
            throw new Error('Only the host can unblock dates.');
          }

          // Check if the requested dates overlap with any blocked dates
          for (let range of property.blockedDates) {
            const rangeStartDate = new Date(range.startDate).getTime();
            const rangeEndDate = new Date(range.endDate).getTime();

            if (
              (startDate.getTime() >= rangeStartDate && startDate.getTime() <= rangeEndDate) ||
              (endDate.getTime() >= rangeStartDate && endDate.getTime() <= rangeEndDate)
            ) {
              throw new Error('The property is already blocked for the requested dates.');
            }
          }

          // If no overlap, proceed with blocking the dates
          let blockedDates = [...property.blockedDates, { startDate, endDate }];

          // Sort the blocked dates
          blockedDates.sort((a, b) => a.startDate - b.startDate);

          // Merge overlapping ranges
          const mergedBlockedDates = blockedDates.reduce((acc, range) => {
            if (!acc.length || acc[acc.length - 1].endDate < range.startDate) {
              acc.push(range);
            } else if (acc[acc.length - 1].endDate < range.endDate) {
              acc[acc.length - 1].endDate = range.endDate;
            }
            return acc;
          }, []);

          const updatedProperty = await ShortletProperty.findByIdAndUpdate(
            { _id: args.propertyId },
            { $set: { blockedDates: mergedBlockedDates } },
            { new: true },
          );

          return {
            message:
              'Dates have been successfully blocked! Your property is now unavailable for new bookings during the specified period.',
            property: updatedProperty,
          };
        } catch (error) {
          return { message: `${error.message}` };
        }
        // Parse the dates in 'DD/MM/YYYY' format
      },
    },

    unblockDates: {
      type: BlockUnblockPropertyType,
      args: {
        userId: { type: GraphQLNonNull(GraphQLString) },
        propertyId: { type: GraphQLNonNull(GraphQLString) },
        startDate: { type: GraphQLNonNull(GraphQLString) },
        endDate: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        try {
          // Parse the dates in 'DD/MM/YYYY' format
          const startDate = new Date(args.startDate.split('/').reverse().join('-'));
          const endDate = new Date(args.endDate.split('/').reverse().join('-'));

          const property = await ShortletProperty.findById(args.propertyId);

          // Check if the user is the host of the property
          if (property.user.toString() !== args.userId) {
            throw new Error('Only the host can unblock dates.');
          }

          const newBlockedDates = [];
          for (let range of property.blockedDates) {
            const rangeStartDate = new Date(range.startDate).getTime();
            const rangeEndDate = new Date(range.endDate).getTime();

            if (startDate.getTime() > rangeStartDate && endDate.getTime() < rangeEndDate) {
              // The unblocked date range falls within the blocked date range
              // Split the blocked date range into two
              newBlockedDates.push(
                { startDate: range.startDate, endDate: new Date(startDate.getTime() - 86400000) },
                { startDate: new Date(endDate.getTime() + 86400000), endDate: range.endDate },
              );
            } else if (!(startDate.getTime() <= rangeEndDate && endDate.getTime() >= rangeStartDate)) {
              // The unblocked date range does not overlap with the blocked date range
              // Keep the blocked date range as is
              newBlockedDates.push(range);
            }
          }

          const updatedProperty = await ShortletProperty.findByIdAndUpdate(
            { _id: args.propertyId },
            { $set: { blockedDates: newBlockedDates } },
          );

          // Return a success message
          return {
            message: 'Dates have been successfully unblocked! Your property is ready for new bookings.',
            property: updatedProperty,
          };
        } catch (error) {
          return { message: `An error occurred while unblocking dates: ${error.message}` };
        }
      },
    },

    requestApproval: {
      type: ApprovalType,
      args: {
        bookingId: { type: GraphQLNonNull(GraphQLID) },
        userId: { type: GraphQLNonNull(GraphQLID) },
        message: { type: GraphQLString },
      },
      resolve: async (parent, args, context) => {
        const { io } = context;

        //<--------- create an approval based on the booking id ---------->
        const approval = new Approval({
          booking: args.bookingId,
          user: args.userId,
          message: args.message,
        });

        const createdApproval = await approval.save();
        const booking = await Booking.findById(args.bookingId).populate('user property');
        //<---------- find the host who owns that property ---------->
        const host = await User.findById(booking.property.user);
        const hostEmail = host.email;

        const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
        const manageShortletUrl = `${baseUrl}/manage-shortlets`;
        //<---------- email option for booking request ---------->
        const bookingDetails = {
          ...booking._doc,
          startDate: moment(booking.startDate).format('DD MMMM YYYY'),
          endDate: moment(booking.endDate).format('DD MMMM YYYY'),
        };
        const hostMail = {
          From: 'admin@polis.ng',
          To: hostEmail,
          Subject: `New Booking Request for ${booking.property.title}`,
          HtmlBody: BOOKING_REQUEST_TEMPLATE(host, bookingDetails, manageShortletUrl),
        };

        const notificationLink = `/review-booking/${booking.property._id.toString()}`;

        try {
          const result = await client.sendEmail(hostMail);

          sendNotification(
            io,
            host._id.toString(),
            'Booking Request',
            `You have a new booking request for your property ${booking.property.title}.`,
            notificationLink,
          );

          console.log('sent');
        } catch (error) {
          console.error('Error sending email to host:', error);
        }

        return createdApproval;
      },
    },

    updateApprovalStatus: {
      type: ApprovalWithConflictType,
      args: {
        id: { type: GraphQLNonNull(GraphQLID) },
        status: { type: GraphQLNonNull(ApprovalStatusEnum) },
        expireTime: { type: GraphQLInt },
        confirmOverlap: { type: GraphQLBoolean },
      },
      resolve: async (parent, { id, status, expireTime, confirmOverlap }, context) => {
        const { io } = context;
        let approval = await Approval.findById(id)
          .populate({
            path: 'booking',
            populate: {
              path: 'property',
            },
          })
          .populate('user');

        if (!approval) {
          throw new Error('Approval request not found');
        }

        const { booking, user } = approval;

        const adminUserId = '664e3c342d09241e2cb93500';
        const adminUser = await User.findById(adminUserId);

        if (!adminUser) {
          throw new Error('Admin user not found');
        }
        const conversationId = `${'664e3c342d09241e2cb93500'}-${booking?.user?._id}`;
        let messageDoc = await Message.findOne({ conversationId });
        if (!messageDoc) {
          messageDoc = new Message({ conversationId });
        }

        if (status === 'approved') {
          const startDate = new Date(booking.startDate);
          const endDate = new Date(booking.endDate);
          const potentialConflictBookings = await Booking.find({
            property: booking.property._id,
            status: 'Pending',
            enablePayment: false,
            _id: { $ne: booking._id },
          }).populate('user');
          const potentialConflictBookingsId = potentialConflictBookings.map((booking) => booking._id);
          //<---------- conflicting bookings with an approval -------->
          const potentialConflictApprovals = await Approval.find({
            booking: { $in: potentialConflictBookingsId },
            status: 'pending',
          })
            .populate({
              path: 'booking',
              populate: { path: 'property' },
            })
            .populate('user');

          const conflictingRequests = potentialConflictApprovals.filter((potentialConflictApproval) => {
            const bStartDate = new Date(potentialConflictApproval.booking.startDate);
            const bEndDate = new Date(potentialConflictApproval.booking.endDate);
            return (
              (bStartDate <= endDate && bEndDate >= startDate) ||
              (bStartDate <= startDate && bEndDate >= endDate) ||
              (bStartDate >= startDate && bStartDate <= endDate) ||
              (bEndDate >= startDate && bEndDate <= endDate)
            );
          });

          if (conflictingRequests.length > 0 && !confirmOverlap) {
            throw new Error('There are overlapping requests. Confirm again to disable them.');
          }
          if (expireTime <= 0 || expireTime > 12) {
            throw new Error('Invalid expiration time. Must be between 1 and 12 hours');
          }

          for (let conflict of conflictingRequests) {
            if (conflict.booking.isActive) {
              conflict.booking.isActive = false;
              conflict.booking.linkedBooking = booking._id;
              await conflict.booking.save();
              await conflict.save();
            }
          }

          // Set enablePayment to true for the booking
          await Booking.findByIdAndUpdate(booking._id, { enablePayment: true });
          //<-------- make current approval request inactive ------->
          approval.booking.isActive = false;
          approval.status = 'approved';
          await approval.booking.save();
          await approval.save();

          let checkInAfter = booking.property.thingsToKnow.checkInAfter;
          let checkOutBefore = booking.property.thingsToKnow.checkOutBefore;

          const checkInTime = new Date(
            `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()} ${checkInAfter}`,
          );
          const expireTimeMs = new Date(Date.now() + expireTime * 60 * 60 * 1000);
          const twentyFourHoursBeforeCheckIn = new Date(checkInTime.getTime() - 24 * 60 * 60 * 1000);

          if (expireTimeMs > twentyFourHoursBeforeCheckIn) {
            throw new Error('Expiration time must be set at least 24 hours before the check-in time');
          }

          const token = jwt.sign({ bookingId: booking._id }, process.env.JWT_SECRET, {
            expiresIn: expireTimeMs - Date.now(),
          });

          const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
          const checkoutLink = `${baseUrl}/checkout?bookingId=${booking._id}&propertyId=${booking.property._id}&token=${token}`;
          console.log({ checkoutLink, booking });

          checkInAfter = moment(checkInAfter, 'HH:mm').format('hh:mm A');
          checkOutBefore = moment(checkOutBefore, 'HH:mm').format('hh:mm A');

          const emailBody = {
            ...booking._doc,
            totalCost: `₦${booking.totalCost?.toLocaleString('en-US')}`,
            startDate: moment(booking.startDate).format('DD MMMM YYYY'),
            endDate: moment(booking.endDate).format('DD MMMM YYYY'),
            expireTime: expireTime == 1 ? '1 hour' : `${expireTime} hours`,
            checkoutLink,
          };
          const approvalMail = {
            From: 'admin@polis.ng',
            To: user.email,
            Subject: 'Your Booking Request Has Been Approved',
            HtmlBody: BOOKING_REQUEST_APPROVED_TEMPLATE(user, emailBody),
          };

          const notificationLink = `/shortlet/listingdetails/${booking.property._id.toString()}`;

          try {
            const result = await client.sendEmail(approvalMail);
            sendNotification(
              io,
              user._id.toString(),
              'Booking Approved',
              `Congratulations! Your booking request for the property ${booking.property.title} has been approved.`,
              notificationLink,
            );

            // Push the new message to the conversation
            messageDoc.messages.push({
              userId: '664e3c342d09241e2cb93500',
              senderId: '664e3c342d09241e2cb93500',
              recipientId: booking?.user?._id,
              text: `Congratulations! 🎉<br />
                    Your booking request for <strong>${booking.property.title}</strong> from <strong>${moment(booking.startDate).format('DD MMMM YYYY')}</strong> to <strong>${moment(booking.endDate).format('DD MMMM YYYY')}</strong> has been approved.<br /><br />
                    Check-in after: <strong>${checkInAfter}</strong><br />
                    Check-out before: <strong>${checkOutBefore}</strong><br /><br />
                    Total Price: <strong>${`₦${booking.totalCost?.toLocaleString('en-US')}`}</strong><br /><br />
                    To complete your booking, please <a href="${checkoutLink}" style="color: blue; text-decoration: underline;">click here</a> to proceed to checkout.<br />
                    Note: This link will expire in ${expireTime} hours.`,
              listingId: '664e3c342d09241e2cb93500',
              name: 'Polis Admin',
              title: 'Listing Created',
              listingType: booking.property.listingType,
              pic: 'https://lh3.googleusercontent.com/a/ACg8ocLTOjaa4pToPT6GtfXuJ2_sjN5AbhK8Y-X8ErQhCw7ePeIwSg=s96-c',
              senderEmail: 'polisng01@gmail.com',
            });

            await messageDoc.save();

            // Emit the message to the conversation
            io.to(conversationId).emit('message', {
              conversationId,
              userId: '664e3c342d09241e2cb93500',
              senderId: '664e3c342d09241e2cb93500',
              recipientId: booking?.user?._id,
              text: `Congratulations! 🎉<br />
  Your booking request for <strong>${booking.property.title}</strong> from <strong>${moment(booking.startDate).format('DD MMMM YYYY')}</strong> to <strong>${moment(booking.endDate).format('DD MMMM YYYY')}</strong> has been approved.<br /><br />
  Check-in after: <strong>${checkInAfter}</strong><br />
  Checkout-out before: <strong>${checkOutBefore}</strong><br /><br />
  Total Price: <strong>${`₦${booking.totalCost?.toLocaleString('en-US')}`}</strong><br /><br />
  To complete your booking, please <a href="${checkoutLink}" style="color: blue; text-decoration: underline;">click here</a> to proceed to checkout.<br />
  Note: This link will expire in ${expireTime} hours.`,
              listingId: '664e3c342d09241e2cb93500',
              name: 'Polis Admin',
              title: 'Listing Created',
              listingType: booking.property.listingType,
              pic: 'https://lh3.googleusercontent.com/a/ACg8ocLTOjaa4pToPT6GtfXuJ2_sjN5AbhK8Y-X8ErQhCw7ePeIwSg=s96-c',
              senderEmail: 'polisng01@gmail.com',
            });
          } catch (error) {
            console.error('Error sending approval email:', error);
          }

          return { approval, conflictingRequests };
        } else if (status === 'rejected') {
          const booking = await Booking.findByIdAndUpdate(approval.booking._id, { status: 'Cancelled' }, { new: true });
          approval = await Approval.findByIdAndUpdate(approval._id, { status: 'rejected' }, { new: true })
            .populate({ path: 'booking', populate: { path: 'property' } })
            .populate('user');

          const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
          const url = `${baseUrl}/`;

          const emailBody = {
            ...approval.booking._doc,
            startDate: moment(approval.booking.startDate).format('DD MMMM YYYY'),
            endDate: moment(approval.booking.endDate).format('DD MMMM YYYY'),
          };
          const rejectionMail = {
            From: 'admin@polis.ng',
            To: approval.user.email,
            Subject: 'Your Booking Request Has Been Declined',
            HtmlBody: BOOKING_REQUEST_REJECTED_TEMPLATE(approval.user, emailBody, url),
          };

          const notificationLink = `/shortlet/listingdetails/${booking.property._id.toString()}`;

          try {
            const result = await client.sendEmail(rejectionMail);

            sendNotification(
              io,
              user._id.toString(),
              'Booking Declined',
              `Unfortunately, your booking request for the property ${emailBody.property.title} has been rejected.`,
              notificationLink,
            );

            messageDoc.messages.push({
              userId: '664e3c342d09241e2cb93500',
              senderId: '664e3c342d09241e2cb93500',
              recipientId: booking?.user?._id,
              text: `Unfortunately, your booking request for <strong>${emailBody.property.title}</strong> from <strong>${moment(booking.startDate).format('DD MMMM YYYY')}</strong> to <strong>${moment(booking.endDate).format('DD MMMM YYYY')}</strong> has been rejected.`,
              listingId: '664e3c342d09241e2cb93500',
              name: 'Polis Admin',
              title: 'Listing Created',
              listingType: booking.property.listingType,
              pic: 'https://lh3.googleusercontent.com/a/ACg8ocLTOjaa4pToPT6GtfXuJ2_sjN5AbhK8Y-X8ErQhCw7ePeIwSg=s96-c',
              senderEmail: 'polisng01@gmail.com',
            });
            await messageDoc.save();

            // Emit the message to the conversation
            io.to(conversationId).emit('message', {
              conversationId,
              userId: '664e3c342d09241e2cb93500',
              senderId: '664e3c342d09241e2cb93500',
              recipientId: booking?.user?._id,
              text: ` Unfortunately, your booking request for <strong>${emailBody.property.title}</strong> from <strong>${moment(booking.startDate).format('DD MMMM YYYY')}</strong> to <strong>${moment(booking.endDate).format('DD MMMM YYYY')}</strong> has been rejected.`,
              listingId: '664e3c342d09241e2cb93500',
              name: 'Polis Admin',
              title: 'Listing Created',
              listingType: booking.property.listingType,
              pic: 'https://lh3.googleusercontent.com/a/ACg8ocLTOjaa4pToPT6GtfXuJ2_sjN5AbhK8Y-X8ErQhCw7ePeIwSg=s96-c',
              senderEmail: 'polisng01@gmail.com',
            });
          } catch (error) {
            console.error('Error sending rejection email:', error);
          }
          return { approval, conflictingRequests: [] };
        } else {
          throw new Error('Invalid status');
        }
      },
    },
  }),
});

const schema = new GraphQLSchema({
  query: RootQuery,
  mutation,
});

module.exports = schema;
