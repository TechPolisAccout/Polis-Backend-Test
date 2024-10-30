const mongoose = require('mongoose');
const Booking = require('./booking');

describe('Booking Model Tests', () => {
  it('should error when required fields are missing', () => {
    const bookingWithoutRequiredFields = new Booking({});

    const validationError = bookingWithoutRequiredFields.validateSync();

    expect(validationError.errors['user']).toBeDefined();
    expect(validationError.errors['property']).toBeDefined();
    expect(validationError.errors['startDate']).toBeDefined();
    expect(validationError.errors['endDate']).toBeDefined();
    expect(validationError.errors['numberOfGuests']).toBeDefined();
  });

  it('should set default values for status, enablePayment, and isActive', () => {
    const validBooking = new Booking({
      user: new mongoose.Types.ObjectId(),
      property: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(),
      numberOfGuests: 2,
    });

    expect(validBooking.status).toBe('Pending');
    expect(validBooking.enablePayment).toBe(false);
    expect(validBooking.isActive).toBe(true);
  });

  it('should allow only valid status values', () => {
    const invalidBookingStatus = new Booking({
      user: new mongoose.Types.ObjectId(),
      property: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(),
      numberOfGuests: 2,
      status: 'InvalidStatus',
    });

    const validationError = invalidBookingStatus.validateSync();

    expect(validationError.errors['status']).toBeDefined();
    expect(validationError.errors['status'].message).toBe(
      '`InvalidStatus` is not a valid enum value for path `status`.',
    );
  });

  it('should allow only valid payment status values', () => {
    const invalidPaymentStatus = new Booking({
      user: new mongoose.Types.ObjectId(),
      property: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(),
      numberOfGuests: 2,
      payment: { status: 'InvalidPaymentStatus' },
    });

    const validationError = invalidPaymentStatus.validateSync();

    expect(validationError.errors['payment.status']).toBeDefined();
    expect(validationError.errors['payment.status'].message).toBe(
      '`InvalidPaymentStatus` is not a valid enum value for path `payment.status`.',
    );
  });

  it('should calculate number of nights correctly if provided', () => {
    const booking = new Booking({
      user: new mongoose.Types.ObjectId(),
      property: new mongoose.Types.ObjectId(),
      startDate: new Date('2024-10-01'),
      endDate: new Date('2024-10-05'),
      numberOfGuests: 2,
    });

    const nights = (booking.endDate - booking.startDate) / (1000 * 60 * 60 * 24);
    expect(nights).toBe(4);
  });

  it('should allow linkedBooking to be null by default', () => {
    const validBooking = new Booking({
      user: new mongoose.Types.ObjectId(),
      property: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      endDate: new Date(),
      numberOfGuests: 2,
    });

    expect(validBooking.linkedBooking).toBeNull();
  });
});
