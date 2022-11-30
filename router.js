const express = require('express')
const router = express.Router()
const mongoHandler = require('./mongoHandler')

router.get('/artists', (_, res) => {
  mongoHandler.findArtist(res).then()
})

router.post('/artists', (req, res) => {
  mongoHandler.insertArtist(req.body.name, req.body.photo, req.body.info, res).then()
})

router.get('/albums', (req, res) => {
  console.log(req.query.artist)
  mongoHandler.findAlbums(req.query.artist ? req.query.artist : null, null, res).then()
})

router.get('/albums/:id', (req, res) => {
  mongoHandler.findAlbums(null, req.params.id, res).then()
})

router.post('/albums', (req, res) => {
  mongoHandler.insertAlbums(req.body.name, req.body.artist, req.body.year, req.body.photo, res).then()
})

router.get('/tracks', (req, res) => {
  mongoHandler.findTrack(req.query.album ? req.query.album : null, res).then()
})

router.post('/tracks', (req, res) => {
  mongoHandler.insertTrack(req.body.name, req.body.duration, req.body.album, res).then()
  console.log(1)
})

module.exports = router