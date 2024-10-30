module.exports.NEWSLETTER_SUBSCRIPTION_CONFIRMATION_TEMPLATE = (confirmationMessage) => {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <h2 style="color: #4338ca;">Newsletter Subscription Confirmation</h2>
        <p style="font-size: 16px;">${confirmationMessage}</p>
        <p style="font-size: 14px; margin-top: 20px;">Best regards,</p>
        <p style="font-size: 14px;">Ogle</p>
    </div>
`;
};
