const { AUTO } = require('jimp')
const { parse } = require('url')
const { isWebUri } = require('valid-url')
const { getImage } = require('./util')
const uuid = require('uuid/v1')
const { tmpdir } = require('os')
const xss = require('xss')
const isImage = require('is-image')
const dir = tmpdir()
const { get } = require('request')

module.exports = johnify

async function johnify(req, res) {
  try {
    const query = parse(req.url, true).query
    var text = xss(query.text)
    const responseUrl = xss(query.response_url)

    if (!text || text.length == 0 || !isWebUri(text) || !isImage(text)) {
      text =  await GetRandomImageURL()
    }
  
    const { url, caption } = parseInput(text)
    const id = uuid()
    const filename = `${id}.png`
    
    const [ john, canvas ] = await Promise.all([
      getImage('./assets/young-john.png'),
      getImage(url)
    ])
  
    const result = await compositeAndWrite({ canvas, john, filename })

    if (result !== 'success') {
      throw result
    }
    
    return {
      response_type: 'in_channel',
      response_url: responseUrl,
      attachments: [
          {
            filename,
            image_url: `${req.protocol}://${req.get('host')}/${filename}`,
          }
      ]
    }
  } catch(err) {
    throw err.message
  }
}

async function GetRandomImageURL(search) {
  var url ='http://api.flickr.com/services/feeds/photos_public.gne?nojsoncallback=1&format=json';

  if(search && search.length>0){
    url+='&tags='+search;
  }

  return new Promise((resolve, reject) => {
    get(url, function(error, response, body) {
      try{
        var data = JSON.parse(body.replace(/\\'/g, "'"));
        var image_src = data.items.length > 0 && data.items[Math.floor(Math.random() * data.items.length)]['media']['m'].replace("_m", "_b");
        
        if (!image_src) {
          return resolve('https://s-media-cache-ak0.pinimg.com/736x/91/c2/f8/91c2f8931b4954ab41f665e88b1e1acf--paula-deen-happy-thanksgiving.jpg');
        }

        return resolve(image_src);
      }
      catch(err){
        return resolve('https://s-media-cache-ak0.pinimg.com/736x/91/c2/f8/91c2f8931b4954ab41f665e88b1e1acf--paula-deen-happy-thanksgiving.jpg');
      }
    })
  })
}

function parseInput(input) {
  const [ url, caption ] = input.split(' ')

  return {
    url,
    caption
  }
}

function compositeAndWrite({ canvas, john, filename }) {
  return new Promise((resolve, reject) => {
    if (canvas.bitmap.width > 800) {
      canvas.resize(800, AUTO)
    }

    const { width } = canvas.bitmap
    const { height } = canvas.bitmap
    
    if(width<height)
      john.resize(width * 0.4, AUTO)
    else
      john.resize(AUTO, height * 0.6)

    const johnWidth = width - john.bitmap.width
    const johnHeight = height - john.bitmap.height

    canvas
      .composite(john, johnWidth, johnHeight)
      .write(`${dir}/${filename}`, (err) => {
        if (err) {
          return reject(err)
        }

        resolve('success')
      })
  })
}