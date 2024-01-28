// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/otp-auth', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});


// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define MongoDB schema and model for OTP storage
const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
});

const Otp = mongoose.model('Otp', otpSchema);

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_email_password',
  },
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Express routes
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();

  // Save OTP to the database
  const newOtp = new Otp({ email, otp });
  await newOtp.save();

  // Send OTP to the user's email
  const mailOptions = {
    from: 'your_email@gmail.com',
    to: email,
    subject: 'OTP for Authentication',
    text: `Your OTP is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }
    res.json({ success: true, message: 'OTP sent successfully' });
  });
});

app.post('/verify-otp', async (req, res) => {
  const { email, enteredOTP } = req.body;

  // Check if OTP is valid
  const storedOTP = await Otp.findOne({ email, otp: enteredOTP });

  if (storedOTP) {
    // Valid OTP, you can redirect the user to the welcome page
    res.json({ success: true, message: 'OTP verified successfully' });
  } else {
    // Invalid OTP
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
