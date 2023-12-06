const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
// const multer = require('multer');

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
  dob: Date,     // Add email field
  location: String,    // Add location field
  bio: String,         // Add bio field  // Keep the gallery field as it is
});
// const upload = multer();
// Signup endpoint
app.post('/signup',async (req, res) => {
  try {
    const { username, password, email,dob, location, bio } = req.body;
    // const profileImage = {
    //   data: req.file.buffer, // Image data
    //   contentType: req.file.mimetype, // Image content type
    // };
    const user = new User({ username, password, email,dob, location, bio  });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    console.log('User data:', user); 
    if (user) {
      res.status(200).json({ message: 'Login successful',user });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});