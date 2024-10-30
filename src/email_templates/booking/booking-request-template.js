module.exports.BOOKING_REQUEST_TEMPLATE = (host, booking, manageShortletUrl) => {
  return `

     <section style="font-family: Nunito, sans-serif; width: auto;max-width: 30rem;margin:auto;">
        <h1 style="font-size: 25px;">Hello <span style="color: #3270fc;">${host.name}</span></h1>
        <p style="font-size: 15px;line-height: 22.5px;">A new booking request for <span
                style="font-weight:bold">${booking.property.title}</span> has been received</p>
        <div>
            <h2 style="font-size: 17px;">Booking Details:</h2>
            <div style="display:flex;flex-wrap:wrap;">
                <h3 style="font-size: 15px;line-height: 22.5px;">Guest Name:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.user.name}</h3>
            </div>
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
        </div>
        <div>
            <p style="font-size: 15px;line-height: 22.5px;">To review the complete details of this booking request,
                please click the View request button below
            </p>
            <a href="${manageShortletUrl}"
                style="display: inline-block; background-color: #3270fc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 0.5rem; font-size: 16px; margin-top: 20px;">View
                Request</a>

        </div>
        <div>
            <p style="font-size: 15px;line-height: 22.5px;">Thank you,</p>
            <p style="font-size: 15px;line-height: 22.5px;">Polis Admin</p>
        </div>
    </section>
 `;
};
