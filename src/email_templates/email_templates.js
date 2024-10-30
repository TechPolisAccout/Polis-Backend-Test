const { EMAIL_VERIFICATION_TEMPLATE } = require('./auth/email-verification-template');
const { BOOKING_REQUEST_TEMPLATE } = require('./booking/booking-request-template');
const { PASSWORD_RESET_TEMPLATE } = require('../email_templates/auth/password-reset-template');
const {
  ACCOUNT_DELETION_CONFIRMATION_TEMPLATE,
} = require('../email_templates/account/account-deletion-confirmation-template');
const { NEWSLETTER_SUBSCRIPTION_CONFIRMATION_TEMPLATE } = require('./newsletter/newsletter-subscription-confirmation');
const { BOOKING_REQUEST_REJECTED_TEMPLATE } = require('./booking/booking-request-rejected-template');
const { BOOKING_REQUEST_APPROVED_TEMPLATE } = require('./booking/booking-request-approved-template');
const { BOOKING_PAYMENT_CONFIRMATION_TEMPLATE } = require('./booking/booking-payment-confirmation');




module.exports = {
  EMAIL_VERIFICATION_TEMPLATE,
  BOOKING_REQUEST_TEMPLATE,
  BOOKING_REQUEST_REJECTED_TEMPLATE,
  BOOKING_REQUEST_APPROVED_TEMPLATE,
  BOOKING_PAYMENT_CONFIRMATION_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
  ACCOUNT_DELETION_CONFIRMATION_TEMPLATE,
  NEWSLETTER_SUBSCRIPTION_CONFIRMATION_TEMPLATE,
};

//<---------- NOTES ---------->

// This is the central file for the email templates from which all templates are exported and imported from
