const Booking = require('../models/booking');
const Approval = require('../models/requestApproval');

module.exports.checkBookingDateClash = async ({
  booking,
  propertyId = null,
  status = 'Pending',
  enablePayment = false,
  isActive = true,
  startDate: newBookingStartDate,
  endDate: newBookingEndDate,
}) => {
  let currentBooking = booking || null;
  let startDate;
  let endDate;
  let searchProperties;

  if (currentBooking) {
    //<--------- check clash based on if a current booking is provided ------->
    startDate = new Date(currentBooking.startDate);
    endDate = new Date(currentBooking.endDate);
    searchProperties = { property: currentBooking.property._id, _id: { $ne: currentBooking._id } };
  } else {
    startDate = new Date(newBookingStartDate);
    endDate = new Date(newBookingEndDate);
    searchProperties = { property: propertyId, isActive };
  }
  const potentialConflictBookings = await Booking.find({
    status,
    enablePayment,
    ...searchProperties,
  });
  const potentialConflictBookingsId = potentialConflictBookings.map(
    (potentialConflictBooking) => potentialConflictBooking._id,
  );
  //<---------- potential conflicting bookings with an approval -------->
  const potentialConflictApprovals = await Approval.find({
    booking: { $in: potentialConflictBookingsId },
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
  return conflictingRequests;
};

module.exports.checkPropertyAvailability = async ({
  property,
  startDate: receivedStartDate,
  endDate: receivedEndDate,
}) => {
  let startDate = new Date(receivedStartDate);
  let endDate = new Date(receivedEndDate);
  let allReservedDates = [];
  allReservedDates = allReservedDates.concat(property.bookedDates, property.blockedDates);
  const conflictingDateRange = allReservedDates.filter((reservedDate) => {
    const bStartDate = new Date(reservedDate.startDate);
    const bEndDate = new Date(reservedDate.endDate);
    return (
      (bStartDate <= endDate && bEndDate >= startDate) ||
      (bStartDate <= startDate && bEndDate >= endDate) ||
      (bStartDate >= startDate && bStartDate <= endDate) ||
      (bEndDate >= startDate && bEndDate <= endDate)
    );
  });
  const isPropertyAvailable = conflictingDateRange.length === 0;
  return isPropertyAvailable;
};
