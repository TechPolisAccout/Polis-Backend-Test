const mongoose = require('mongoose');
const ShortletProperty = require('./src/models/shortlet');

async function updateListingStatus() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const propertiesWithoutInstantBooking = await ShortletProperty.find({ instantBooking: { $exists: false } });

    // Loop through each property and add the instantBooking field
    for (let property of propertiesWithoutInstantBooking) {
      property.instantBooking = false; // or set to true if you want the default value to be true
      await property.save();
    }

    console.log(`Updated ${propertiesWithoutInstantBooking.length} properties with the instantBooking field.`);
  } catch (err) {
    console.error('Error updating documents: ', err);
  } finally {
    mongoose.connection.close();
  }
}

updateListingStatus();
