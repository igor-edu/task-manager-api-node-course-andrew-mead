const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/UserRouter')
const taskRouter = require('./routers/TaskRouter')

const app = express();

const port = process.env.PORT || 3003;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => console.log('server started on port: ' + port));




