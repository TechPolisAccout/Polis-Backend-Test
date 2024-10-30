const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingSchema = new Schema(
  {
    enablePayment: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'ShortletProperty',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    numberOfNights: {
      type: Number,
    },
    serviceCharge: {
      type: Number,
    },
    costForNights: {
      type: Number,
    },
    totalCost: {
      type: Number,
    },
    averageRating: {
      type: Number,
    },
    totalReviews: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
      default: 'Pending',
    },
    isActive: { type: Boolean, default: true },
    linkedBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    payment: {
      status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending',
      },
      transactionId: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Booking', BookingSchema);
