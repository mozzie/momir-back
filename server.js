#!/usr/bin/env node

const express = require('express')
const fs = require('fs')
const request = require('request')
const Jimp = require('jimp')
const printer = require('node-native-printer')
const cors = require('cors')

let rawdata = fs.readFileSync('creatures.json')
let cards = JSON.parse(rawdata);
let cardlist = []

cards.forEach(c => {
if(!cardlist[c.convertedManaCost]) {
    cardlist[c.convertedManaCost] = []
}
if(c.scryfallId) {
  cardlist[c.convertedManaCost].push(c)
}
})

if(!fs.existsSync(__dirname + "/pictures")) {
  fs.mkdirSync(__dirname + "/pictures/")
}
if(!fs.existsSync(__dirname + "/dithered")) {
  fs.mkdirSync(__dirname + "/dithered/")
}

const app = express()

app.use(cors())

app.get('/card/:cmc', (req, res) => {
   let card = {}
   if(cardlist[req.params.cmc]) {
       card = cardlist[req.params.cmc][Math.floor(Math.random()*cardlist[req.params.cmc].length)]
   }
   res.send(card)
})

app.get('/dithered/:scryFallId', (req, res) => {
  getCard(req.params.scryFallId, (path) => path ? dither(req.params.scryFallId, path, (path) => res.sendFile(path)) : res.send({error: "card not found", id: req.params.scryFallId}))
})

app.get('/picture/:scryFallId', (req, res) => {
 getCard(req.params.scryFallId, (path) => path ? res.sendFile(path): res.send({error: "card not found", id: req.params.scryFallId}))
})

app.get('/printers', (req, res) => {
 res.send(printer.listPrinters())
})

app.get('/print/:scryFallId', (req, res) => {
 if(printer.listPrinters().map(p => p.name).includes(req.query.printer)) {
   getCard(req.params.scryFallId, (path) => dither(req.params.scryFallId, path, (ditherPath) => printer.print(ditherPath, {})))
   res.send({"printed":true})
 }
 else {
   res.send({"printed":false})
 }
})

const getCard = (scryFallId, cb) => {
 const filePath = __dirname + "/pictures/"+scryFallId +".jpg"
 if(!fs.existsSync(filePath)) {
  let SFurl = "https://api.scryfall.com/cards/" + scryFallId;
  request.get(SFurl, (err, response, body) => {
    if(err) {
        console.log("ERROR: (" + SFurl + ") " + err)
        cb(null);
    }
    else {
      let card = JSON.parse(body)
      let uri = undefined
      if(card.image_uris && card.image_uris.normal) {
        uri = card.image_uris.normal
      }
      else if(card.card_faces 
              && card.card_faces.length > 0 
              && card.card_faces[0].image_uris
              && card.card_faces[0].image_uris.normal) {
       uri = card.card_faces[0].image_uris.normal
     }
      
      if(uri) {
        Jimp.read(uri)
            .then(image => image.resize(230,320))
            .then(image => image.write(filePath, 
                  () => cb(filePath) 
            ))
      }
      else {
        console.log("Card not found from URL:" + SFurl);
        cb(null);
      }
    }
  })
 }
 else { 
  cb(filePath)
 }
}

const server = app.listen(8081, () => {
   console.log("Server started")
})

const dither = (scryFallId, cardPath, cb) => {
 const filePath = __dirname + "/dithered/"+scryFallId +".jpg";
 if(!fs.existsSync(filePath)) {
   Jimp.read(cardPath).then(image => 
     image.greyscale()).then(image => {
      bits = image.bitmap.data.filter((value, index) => index % 4 == 0)
      floydSteinberg(bits, image.bitmap.width, image.bitmap.height)
      for(let i = 0; i<bits.length;i++) {
          image.bitmap.data[i*4] = image.bitmap.data[i*4+1] = image.bitmap.data[i*4+2] = bits[i]
          image.bitmap.data[i*4+3] = 255
      }
      image.write(filePath, () => cb(filePath))
     })
 }
 else {
   cb(filePath)
 }
}

const floydSteinberg = (sb, w, h) => {
  for(let i=0; i<h; i++) {
    for(let j=0; j<w; j++) {
      let ci = i*w+j;
      let cc = sb[ci];
      let rc = (cc<128?0:255);
      let err = (cc-rc)>>3;
      sb[ci] = rc;
      if(j+1<w) sb[ci  +1] += (err*7)>>4;
      if(i+1==h) continue;
      if(j  >0) sb[ci+w-1] += (err*3)>>4;
                sb[ci+w  ] += (err*5)>>4;
      if(j+1<w) sb[ci+w+1] += (err*1)>>4;
    }
  }
}


