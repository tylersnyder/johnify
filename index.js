const express = require('express')
const app = express()
const johnify = require('./johnify')
const { tmpdir } = require('os')
const root = tmpdir()
const { post } = require('request')

app.use(express.static(root))

app.get('/', async (req, res) => {
  try {
    const result = await johnify(req, res)
    const { filename } = result.attachments[0]
    res.sendFile(filename, { root })
  } catch(err) {
    console.log(err)
    res.status(500)
       .send(err)
  }
})

app.get('/api/slack', async (req, res) => {
  try {
    res.send({
      response_type: 'in_channel',
      text: 'working on it...'
    })

    const result = await johnify(req, res)
    const { response_url } = result

    if (response_url) {
      const payload = {
        response_type: 'in_channel',
        response_url: result.responseUrl,
        replace_original: true,
        attachments: result.attachments
      }

      console.log('slack response url: ', response_url)
      console.log('slack post payload: ', payload)
    
      post(response_url, { json: payload })
    }
  } catch(err) {
    console.log(err)
    
    res.status(200)
       .send({ text: err.message })
  }
})

app.listen(8080, () => console.log('listening on port 8080'))
