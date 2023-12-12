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
      rating: Number, // Rating out of 5
      comment: String,
      createdBy: String, // The username of the user who created the review
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
  // Use an existing Customer ID if this is a returning customer.
  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customer.id},
    {apiVersion: '2023-10-16'}
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: 'eur',
    customer: customer.id,
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
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
});

app.get('/reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId });
    console.log('product id:',productId);
    console.log('review:',reviews);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/add-review', async (req, res) => {
  try {
    const { username, productId, rating, comment } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user has already reviewed the product
    const existingReview = user.reviews.find((review) => review.productId === productId);

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Save the new review to the Review collection
    const newReview = new Review({ productId, rating, comment, createdBy: username });
    await newReview.save();

    // Add the review reference to the user's reviews array
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

// Express route to add a new bid
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
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

