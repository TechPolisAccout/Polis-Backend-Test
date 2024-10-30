module.exports.EMAIL_VERIFICATION_TEMPLATE = (verifyEmailLink, name, expirationTime) => {
  return `
     <div style="font-family: Nunito, sans-serif; padding: 20px; width: auto;max-width: 30rem;margin:auto;">
        <h2 style="font-size: 25px;">Hello <span style="color: #3270fc;">${name}</span></h2>
        <p style="font-size: 17px;line-height: 22.5px;">Thank you for registering!</p>
        <p style="font-size: 15px;line-height: 22.5px;">Please verify your email address to complete your signup. This
            link will expire in ${expirationTime}.</p>
        <a href=${verifyEmailLink}
            style="display: inline-block; background-color: #3270fc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 0.5rem; font-size: 16px; margin-top: 20px;">Verify
            Email</a>
        <p style="font-size: 15px; line-height: 22.5px;">If you didn't attempt to verify your email address with
            Polis, you can either delete or ignore this email
        </p>
        <p style="font-size: 15px;line-height: 22.5px;">Thank you,</p>
        <p style="font-size: 15px;line-height: 22.5px;">Polis Admin</p>
    </div>
  `;
};
