const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth')

const TaskRouter = express.Router();


// create a task
TaskRouter.post('/tasks', auth, async (req, res) => {
  // const task = new Task(req.body);
  const task = new Task({
    ...req.body,
    owner: req.user._id // we authenticated this person in the auth middleware and attached it on the request object
  })

  try {
    const saved = await task.save();
    res.status(201).send(saved);
  } catch (error) {
    res.status(400).send(error.message);
  }
})


// get collection of tasks
// GET /tasks?completed=true --> return only completed tasks
// GET /tasks?limit=10&skip=20 ---> limit 10 results per page and skip first 20 results
// GET /tasks?sortBy=createdAt:desc --> sorted tasks
TaskRouter.get('/tasks', auth, async (req, res) => {
  const _id = req.user._id
  const match = {} // this object will be provided to populate
  const sort = {} // object provided to populate for sorting 

  if (req.query.completed) { // check what is provided in the url 
    match.completed = req.query.completed === 'true' // if 'completed=true' provided in the url then match.completed will evaluate to true
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':')
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {
    // const tasks = await Task.find({ owner: _id });
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit), // user provides limit in the url query string
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate()
    res.status(200).send(req.user.tasks);
  } catch (error) {
    res.status(500).send(error.message);
  }
})


// get individual task
TaskRouter.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    // const task = await Task.findById(id);
    const task = await Task.findOne({ _id: _id, owner: req.user._id })
    if (!task) return res.status(404).send('task not found');
    res.status(200).send(task);
  } catch (error) {
    res.status(500).send('server error');
  }
})


// update individual task
TaskRouter.patch('/tasks/:id', auth, async (req, res) => {
  const allowedUpdates = ['completed', 'description'];
  const attemptedUpdates = Object.keys(req.body);
  const areUpdatesValid = attemptedUpdates.every(update => allowedUpdates.includes(update));
  if (!areUpdatesValid) return res.status(400).send({ error: 'invalid update request' });

  try {
    // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // const task = await Task.findById(req.params.id);
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

    if (!task) return res.status(404).send('task not found');

    attemptedUpdates.forEach(update => task[update] = req.body[update]);
    await task.save();
    res.status(200).send(task);

  } catch (error) {
    res.status(400).send(error.message);
  }
})


// delete individual task
TaskRouter.delete('/tasks/:id', auth, async (req, res) => {
  try {
    // const task = await Task.findByIdAndDelete(req.params.id);
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
    if (!task) return res.status(404).send('task not found');
    res.status(200).send(task);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


module.exports = TaskRouter;