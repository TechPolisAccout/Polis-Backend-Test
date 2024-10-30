module.exports.BOOKING_REQUEST_APPROVED_TEMPLATE = (user, booking) => {
  return `
           <div style="font-family: Nunito, sans-serif; width: auto;max-width: 30rem;margin:auto;">
        <h1 style="font-size: 25px;">Congratulations 🎉 <span style="color: #3270fc;">${user.name}</span></h1>
        <p style="font-size: 15px;line-height: 22.5px;">We are pleased to inform you that your booking request for <strong>${booking.property.title}</strong> has
            been approved</p>
        <div>
            <h2 style="font-size: 17px;">Booking Details:</h2>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Check-In Date:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.startDate}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Check-Out Date:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.endDate}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Number of Guests:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.numberOfGuests}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Total Cost:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.totalCost}</h3>
            </div>
        </div>
        <p style="font-size: 15px; line-height: 22.5px;">To proceed to checkout, please click <a
                href="${booking.checkoutLink}">here</a>.</p>
        <p style="font-size: 15px; line-height: 22.5px;">Important: This link will expire in ${booking.expireTime}.</p>



        <div>
            <p style="font-size: 15px;line-height: 22.5px;">Thank you,</p>
            <p style="font-size: 15px;line-height: 22.5px;">Polis Admin</p>
        </div>
    </div>
          `;
};
