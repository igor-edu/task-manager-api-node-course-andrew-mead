const mongoose = require('mongoose');
// const { default: validator } = require('validator');

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });





