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

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
  },
  icon: {
    type: String,
  },
});

const PropertySchema = new Schema(
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
    priceForRent: {
      type: Number,
      required: [
        isRequiredForListingType(LISTING_TYPES.RENT),
        `Price for rent is required for ${LISTING_TYPES.RENT} listings`,
      ],
      min: [0, `Price for ${LISTING_TYPES.RENT} must be a positive value`],
    },
    priceForBuy: {
      type: Number,
      required: [
        isRequiredForListingType(LISTING_TYPES.BUY),
        `Price for buy is required for ${LISTING_TYPES.BUY} listings`,
      ],
      min: [0, `Price for ${LISTING_TYPES.BUY} must be a positive value`],
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
        enum: Object.values(PROPERTY_TYPES.rentAndBuyPropertyType),
        required: [true, 'Property type is a required field'],
      },
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
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Property', PropertySchema);
