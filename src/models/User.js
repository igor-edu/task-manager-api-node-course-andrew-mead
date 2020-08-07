const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./Task');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  age: {
    type: Number,
    default: 0,
    validate: (value) => {
      if (value < 0) throw new Error('age must be non negative')
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: (value) => {
      if (!validator.isEmail(value)) throw new Error('please provide valid email')
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    trim: true,
    validate: (value) => {
      if (value.toLowerCase().includes('password')) throw new Error('password is not supposed to be included')
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  avatar: {
    type: Buffer
  }
}, {
  timestamps: true
});

// create virtual property
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id', // '_id' field of the User is associated with 'owner' field of the Task
  foreignField: 'owner' // name of the field on the Task that will create this relation
})

// hash the password before saving the user
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcryptjs.hash(this.password, 8);
  }
  next();
});

// chech the credentials of the user
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('unable to login');
  const isMatched = await bcryptjs.compare(password, user.password);
  if (!isMatched) throw new Error('unable to login');
  return user;
};


// generate a token for the user, save it to the database and return to caller
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET); // generate token from object and signature
  user.tokens = user.tokens.concat({ token }); // add the token to the user
  await user.save(); // save modified user to database
  return token;
}


// generate public profile for the user by removing password and token 
userSchema.methods.getPublicProfile = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
}


// generate public profile for the user by removing password and token, same as above, both can be used
userSchema.methods.toJSON = function () { // this function is called by JSON.stringify and returned object is stringified
  const user = this;
  const userObject = user.toObject(); // turn the user from database to plain object

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
}


// delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
  const user = this
  await Task.deleteMany({ owner: user._id })
  next()
})

const User = mongoose.model('User', userSchema);

module.exports = User;