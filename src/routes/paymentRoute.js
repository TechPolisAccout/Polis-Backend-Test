/* eslint-disable no-unused-vars */
const express = require('express');
const postmark = require('postmark');
const moment = require('moment');
const client = new postmark.ServerClient(process.env.POSTMARK_APIKEY);
const router = express.Router();
const axios = require('axios');
const Booking = require('../models/booking');
const ShortletProperty = require('../models/shortlet');
const User = require('../models/user');
const Approval = require('../models/requestApproval');
const { checkPropertyAvailability } = require('../lib/dateClashAndAvailability');
const {
  BOOKING_REQUEST_REJECTED_TEMPLATE,
  BOOKING_PAYMENT_CONFIRMATION_TEMPLATE,
} = require('../email_templates/email_templates');

const sendMail = async (booking, mailType) => {
  const baseUrl = process.env.NODE_ENV === 'production' ? process.env.PROD_URL : process.env.DEV_URL;
  const url = `${baseUrl}/`;
  const emailBody = {
    ...booking._doc,
    totalCost: `₦${booking.totalCost?.toLocaleString('en-US')}`,
    startDate: moment(booking.startDate).format('DD MMMM YYYY'),
    endDate: moment(booking.endDate).format('DD MMMM YYYY'),
  };
  let mailOptions;
  if (mailType === 'payment-confirmation-for-host') {
    mailOptions = {
      From: 'admin@polis.ng',
      To: booking.property.user.email,
      Subject: 'Payment Successfully Confirmed for Your Property',
      HtmlBody: BOOKING_PAYMENT_CONFIRMATION_TEMPLATE(emailBody, 'HOST'),
    };
  }
  if (mailType === 'payment-confirmation-for-user') {
    mailOptions = {
      From: 'admin@polis.ng',
      To: booking.user.email,
      Subject: 'Your Payment Has Been Confirmed',
      HtmlBody: BOOKING_PAYMENT_CONFIRMATION_TEMPLATE(emailBody, 'USER'),
    };
  }
  if (mailType === 'rejection-mail') {
    mailOptions = {
      From: 'admin@polis.ng',
      To: booking.user.email,
      Subject: 'Your Booking Request Has Been Declined',
      HtmlBody: BOOKING_REQUEST_REJECTED_TEMPLATE(booking.user, emailBody, url),
    };
  }

  try {
    const result = await client.sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

router.post('/check-booking', async (req, res) => {
  const { bookingId } = req.body;
  const currentBooking = await Booking.findById(bookingId)
    .populate({ path: 'property', populate: { path: 'user' } })
    .populate('user');
  if (!currentBooking) {
    return res.status(400).json({ error: `Booking not found.` });
  }
  const isPropertyAvailable = await checkPropertyAvailability({
    property: currentBooking.property,
    startDate: currentBooking.startDate,
    endDate: currentBooking.endDate,
  });
  if (!isPropertyAvailable) {
    return res.status(400).json({
      error: 'The date you selected for this booking is no longer available, so we cannot process the payment',
    });
  }
  return res.status(200).json(currentBooking);
});
router.post('/verify', async (req, res) => {
  try {
    const { bookingId, reference } = req.body;
    const verifyResponse = await axios({
      method: 'get',
      url: `https://api.paystack.co/transaction/verify/${reference}`,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (verifyResponse.data.data.status === 'success') {
      //<---------- Find linked bookings: Linked bookings are the conflicting requests of this booking date ---------->
      const linkedBookings = await Booking.find({ linkedBooking: bookingId }).populate('user');
      if (linkedBookings.length > 0) {
        let bookingIds = linkedBookings.map((booking) => booking._id);
        for (let linkedBooking of linkedBookings) {
          await sendMail(linkedBooking, 'rejection-mail');
        }
        await Booking.deleteMany({ _id: { $in: bookingIds } });
        await Approval.deleteMany({ booking: { $in: bookingIds } });
      }
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'Confirmed',
          payment: {
            status: 'Completed',
            transactionId: reference,
          },
        },
        { new: true },
      )
        .populate({ path: 'property', populate: { path: 'user' } })
        .populate('user');
      const user = await User.findById(updatedBooking.user);
      user.bookings.push(updatedBooking);
      await user.save();
      await ShortletProperty.updateOne(
        { _id: updatedBooking.property },
        { $push: { bookedDates: { startDate: updatedBooking.startDate, endDate: updatedBooking.endDate } } },
      );
      await sendMail(updatedBooking, 'payment-confirmation-for-user'); //send mail to user
      await sendMail(updatedBooking, 'payment-confirmation-for-host'); //send mail to host
      res.status(200).json(updatedBooking);
    } else {
      const errorMessage = verifyResponse.data.data.gateway_response;
      res.status(400).json({ error: errorMessage || 'Payment failed' });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

module.exports = router;
