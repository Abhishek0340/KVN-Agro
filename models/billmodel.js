
const mongoose = require('mongoose')


const billSchema = new mongoose.Schema({
    customer: {
      name: String,
      mobile: String,
      email: String,
    },
    billDate: String, // Storing datetime as a string
    order: [
      {
        productName: String,
        price: Number,
        quantity: Number,
        totalPrice: Number,
      },
    ],
    total: Number, // Grand total of the bill
  });
  
  // Create Model
  const Bill = mongoose.model("Bill", billSchema);
  module.exports = Bill