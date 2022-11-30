const express = require('express')
const cors = require('cors')
const router = require('./router')

const app = express()
const port = 8000

app.use(cors())
app.use(express.json())
app.use('', router)

app.listen(port, () => {
  console.log('Server started running on port 8000')
})