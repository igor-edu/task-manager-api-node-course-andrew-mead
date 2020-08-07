const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

const userRouter = new express.Router();


// create new user
userRouter.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});


// login specific user 
userRouter.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password); // check credentials and return user
    const token = await user.generateAuthToken(); // generate new token, save on the user in the database
    // res.send({ user: user.getPublicProfile(), token }); 
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});


// logout user
userRouter.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => req.token !== token.token); // filter out the specific token from the user tokens
    await req.user.save(); // save user to database
    res.send(); // send response
  } catch (error) {
    res.status(500).send(error.message); // send error if user token not cleared or user not saved to database
  }
})


// logout specific user from all sessions
userRouter.post('/users/logoutall', auth, async (req, res) => {
  try {
    req.user.tokens = []; // if auth successful delete all the tokens from user
    await req.user.save(); // save the user to database
    res.send(); // send back the response
  } catch (error) {
    res.status(500).send(error.message); // send back the error if tokens not deleted or user not saved to database
  }
})


// get users profile
userRouter.get('/users/me', auth, async (req, res) => {
  res.send(req.user); // if auth successful just send the user back, each user can only see its own profile
})


// -----------------------  get individual user, it is removed because of authentication
// userRouter.get('/users/:id', async (req, res) => {
//   const id = req.params.id;

//   try {
//     const user = await User.findById(id);
//     if (!user) return res.status(404).send('user not found');
//     res.status(200).send(user);
//   } catch (error) {
//     res.status(500).send('server error');
//   }
// })


// update individual user 
userRouter.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  if (!isValidOperation) return res.status(400).send({ error: 'invalid updates' });

  try {
    // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    // const user = await User.findById(req.params.id);
    const user = req.user;
    // req.body.forEach(update => user[update] = req.body[update]);
    updates.forEach(update => user[update] = req.body[update]);
    await user.save(); // this is where middleware gets executed, the one defined with userSchema.pre
    // if (!user) return res.status(404).send();
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send('server error');
  }
})


// delete individual user 
userRouter.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove()
    sendCancelationEmail(req.user.email, req.user.name)
    res.send(req.user)
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// upload file to the server by configuring 'multer' destination folder
const uploadFile = multer({
  // dest: 'avatars', // destination folder if not specified the file binary data will be forwarded to the next function in the router onto req.file
  limits: {
    fileSize: 1000000 // set the file size in bytes
  },
  fileFilter(req, file, cb) { // 'file' contains information about file being sent, and 'cb' is callback function 
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) { // run only if file is not of certain type
      return cb(new Error('please upload an image document')) // call callback with error
    }

    cb(undefined, true) // call callback without error and accept given upload
  }
})


// create route that will process request for uploading a file
userRouter.post('/users/me/avatar', auth, uploadFile.single('avatar'), async (req, res) => { // provide middleware and specify key it will be used to send info to server
  // req.user.avatar = req.file.buffer // save the file binary forwarded from the 'multer' middleware
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer() // resize image and turn to png
  req.user.avatar = buffer // save onto user 
  await req.user.save()
  res.status(200).send()
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})


// route that will delete avatar from user profile 
userRouter.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})


// get the avatar for the user by their id
userRouter.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }

    res.set('Content-Type', 'image/png').send(user.avatar)

  } catch (error) {
    res.status(404).send()
  }
})


module.exports = userRouter;