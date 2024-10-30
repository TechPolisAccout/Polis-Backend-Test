const mongoose = require('mongoose');
const { Schema } = mongoose;
const LISTING_TYPES = require('../constants/listingTypes');
const PROPERTY_TYPES = require('../constants/propertyTypes.js');

function isRequiredForListingType(listingType) {
  return function () {
    return this.listingType === listingType;
  };
}

const STATUS_TYPES = {
  AVAILABLE: 'Available',
  UNAVAILABLE: 'Unavailable',
};

const noteSchema = new mongoose.Schema({
  id: Number,
  content: String,
});

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
  },
  icon: {
    type: String,
  },
});

const ShortletPropertySchema = new Schema(
  {
    listingType: {
      type: String,
      enum: {
        values: Object.values(LISTING_TYPES),
        message: '{VALUE} is not a valid listing type',
      },
      required: [true, 'Listing type is required'],
      index: true,
    },
    pricePerNight: {
      type: Number,
      required: [
        isRequiredForListingType(LISTING_TYPES.SHORTLET),
        `Price is required for ${LISTING_TYPES.SHORTLET} listings`,
      ],
      min: [0, `Price for ${LISTING_TYPES.SHORTLET} must be a positive value`],
    },
    address: {
      type: String,
      required: [true, 'address is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'A title is required for the property listing'],
    },
    amenities: {
      type: [amenitySchema],
    },
    propertyImageList: {
      type: [String],
      required: [true, 'property image/images is/are required for the property listing'],
    },
    favourite: {
      type: Boolean,
      default: false,
      index: true,
    },
    detailedAddress: {
      street: {
        type: String,
        required: [true, 'Street is required'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      state: {
        type: String,
        required: [true, 'State is required'],
      },
    },
    propertyAttributes: {
      numberOfBedrooms: {
        type: Number,
        index: true,
        min: [0, `Number of bedrooms must be a positive value`],
        required: [true, 'Number of bedrooms is required'],
      },
      numberOfGarages: {
        type: Number,
        min: [0, `Number of garages must be a positive value`],
      },
      numberOfGuests: {
        type: Number,
        min: [0, `Number of garages must be a positive value`],
      },
      yearBuilt: {
        type: Number,
        min: [1700, 'Year built cannot be earlier than {VALUE}'],
        max: [new Date().getFullYear(), 'Year built cannot be in the future'],
      },
      size: {
        type: String,
      },
      numberOfBathrooms: {
        type: Number,
        min: [0, `Number of bathrooms must be a positive value`],
        required: [true, 'Number of bathrooms is required'],
      },
      propertyType: {
        type: String,
        enum: Object.values(PROPERTY_TYPES.shortLetPropertyType),
        required: [true, 'Property type is a required field'],
      },
    },

    thingsToKnow: {
      cancellationPolicy: String,
      timeLimit: { type: String, default: '3 hours' }, //This default value is for property that a time limit has not been configured for before integration
      checkInAfter: { type: String },
      checkOutBefore: { type: String },
      specialNotes: [noteSchema],
    },

    status: {
      type: String,
      enum: {
        values: Object.values(STATUS_TYPES),
        message: '{VALUE} is not a valid status',
      },
      default: STATUS_TYPES.AVAILABLE,
    },

    floorPlan: {
      numberOfFloors: {
        type: Number,
        min: [0, `Number of floors must be a positive value`],
      },

      roomSize: {
        type: String,
      },
      bathroomSize: {
        type: String,
      },
    },
    description: {
      type: String,
      required: [true, 'Property description is a required field'],
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    bookedDates: [
      {
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
      },
    ],

    blockedDates: [
      {
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
      },
    ],
    instantBooking: {
      type: Boolean,
      default: false,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'User',
        },
        rating: {
          type: Number,
          required: true,
        },
        comment: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true },
);

ShortletPropertySchema.methods.calculateRatings = async function () {
  const reviews = this.reviews;
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

  this.totalReviews = totalReviews;
  this.averageRating = parseFloat(averageRating.toFixed(1));

  await this.save();
};

module.exports = mongoose.model('ShortletProperty', ShortletPropertySchema);
