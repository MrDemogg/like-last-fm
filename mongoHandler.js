const {MongoClient, ObjectId} = require('mongodb')

const client = new MongoClient('mongodb://localhost:27017')

const mongoHandler = {
  ifElementExists: async (collection, params) => {
    return await collection.findOne(params) !== null;
  },
  insertArtist: async (name, photo, info, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Artists')
      await collection.insertOne({name: name, photo: photo, info: info, _id: new ObjectId()})
      res.status(201).send('Успешно')
      await client.close()
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },
  findArtist: async (res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Artists')
      const artists = await collection.find().toArray()
      res.status(200).send(artists)
      await client.close()
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },
  insertAlbums: async (name, artist, year, photo, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Albums')
      const artists = await client.db('Last-FM').collection('Artists')
      if (await mongoHandler.ifElementExists(artists, {artist: artist})) {
        await collection.insertOne({name: name, artist: artist, year: year, photo: photo, _id: new ObjectId()})
        res.status(201).send('Успешно')
      } else {
        res.status(404).send('Нельзя создать альбом с несуществующим автором')
      }
      await client.close()
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },
  findAlbums: async (artist = null, id = null, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Albums')
      let albums
      if (artist) {
        console.log(artist)
        albums = await collection.find({artist: artist}).toArray()
      } else if (id) {
        await collection.findOne({_id: new ObjectId(id)}).then(response => {
          albums = response
        })
      } else {
        albums = await collection.find().toArray()
      }
      res.status(200).send(albums)
      await client.close()
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },
  insertTrack: async (name, duration, album, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Tracks')
      const albums = await client.db('Last-FM').collection('Albums')
      if (await mongoHandler.ifElementExists(albums, {name: album})) {
        await collection.insertOne({name: name, album: album, duration: duration})
        res.status(201).send('Успешно')
      } else {
        res.status(404).send('Нельзя создать трек с несуществующим альбомом')
      }
      await client.close()
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },
  findTrack: async (album = null, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Tracks')
      let tracks
      if (album) {
        tracks = await collection.find({album: album}).toArray()
      } else {
        tracks = await collection.find().toArray()
      }
      res.status(200).send(tracks)
      await client.close()
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },
}

module.exports = mongoHandler