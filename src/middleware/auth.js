const jwt = require('jsonwebtoken');
const User = require('../models/User');


// middleware to verify the user token, attaches user and token to the request if authenticated, otherwise sends 401 response
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', ''); // fetch the token from Authentication header
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // decode the token to an object we used to encode in User model
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token }); // find the user with specific id and given token

    if (!user) throw new Error();

    req.user = user; // attach the user to the request object which will be forwarded to the router 
    req.token = token; // attach the token 
    next(); // stop middleware and continue to the router

  } catch (error) {
    res.status(401).send({ error: 'please authenticate' })
  }
};

module.exports = auth;