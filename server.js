// Server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_51OKVqaHWdYWtkALOq6YxogC72p3SW6Y6u0QMotc7CF4sRVvKCj9oEWMxiIuSumRYsOWkos3UwZh077x23rHpadXP00ju1hHiyT');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/craftconnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model('User', {
  username: String,
  password: String,
  email: String,
  dob: Date,
  location: String,
  bio: String,
  reviews: [
    {
      rating: Number,
      comment: String,
      createdBy: String,
    },
  ],
});

const Review = mongoose.model('Review', {
  productId: String,
  rating: Number,
  comment: String,
  createdBy: String,
});

const Bid = mongoose.model('Bid', {
  productId: String,
  username: String,
  price: Number,
});

const Request = mongoose.model('Request', {
  productId: String,
  username: String,
  material: String,
  size: String,
  color: String,
  style: String,
  additionalDetails: String,
});

app.post('/signup', async (req, res) => {
  try {
    const { username, password, email, dob, location, bio } = req.body;
    const user = new User({ username, password, email, dob, location, bio });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
      res.status(200).json({ message: 'Login successful', user });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/payment-sheet', async (req, res) => {
  try {
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      {customer: customer.id},
      {apiVersion: '2023-10-16'}
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099,
      currency: 'eur',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: 'pk_test_51OKVqaHWdYWtkALO6ghTEGviBJWi25YqqKHSvgphCk7TDhRTm1kO8WM19yoLzXzOi2acpuRBfqLcOHVBePA0uf3d0024wSYJDl'
    });
  } catch (error) {
    console.error('Error creating payment sheet:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/add-review', async (req, res) => {
  try {
    const { username, productId, rating, comment } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingReview = user.reviews.find((review) => review.productId === productId);

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    const newReview = new Review({ productId, rating, comment, createdBy: username });
    await newReview.save();

    user.reviews.push(newReview);
    await user.save();

    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/bids/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const bids = await Bid.find({ productId });
    res.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/add-bid', async (req, res) => {
  try {
    const { productId, username, price } = req.body;
    const newBid = new Bid({ productId, username, price });
    await newBid.save();
    res.status(201).json({ message: 'Bid added successfully' });
  } catch (error) {
    console.error('Error adding bid:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/requests/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const requests = await Request.find({ productId });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/add-request', async (req, res) => {
  try {
    const { productId, username, material, size, color, style, additionalDetails } = req.body;
    const newRequest = new Request({ productId, username, material, size, color, style, additionalDetails });
    await newRequest.save();
    res.status(201).json({ message: 'Request added successfully' });
  } catch (error) {
    console.error('Error adding request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
