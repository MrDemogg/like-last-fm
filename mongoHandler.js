const {MongoClient, ObjectId} = require('mongodb')
const {v4} = require('uuid')
const bcrypt = require('bcrypt');

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
  insertProfile: async (username, password, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Users')
      await collection.findOne({username: username}).then(response => {
        if (username === response.username) {
          res.status(403).send('Пользователь с таким username уже существует')
        } else {
          let securePassword
          bcrypt.hash(password, 5).then(function(hash) {
            securePassword = hash
          });
          collection.insertOne({username: username, password: securePassword, _id: new ObjectId()}).then()
          res.status(201).send('Успешно')
        }
        client.close()
      })
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },
  login: async (username, password, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Users')
      let token = v4()
      while (token === await collection.findOne({token: token})) {
        token = v4()
      }
      let profile = await collection.findOne({username: username})
      let isPasswordCorrect = false
      if (profile !== null) {
        await bcrypt.compare(password, profile.password).then(function (result) {
          isPasswordCorrect = result
          console.log(result)
        })
        if (isPasswordCorrect) {
          await collection.updateOne(
            {username: username, password: profile.password},
            {$set: {token: token}}).then(() => {
              res.status(201).send({token: token})
            }
          )
        } else {
          res.status(418).send('Не правильный пароль пупсик')
        }
      } else {
        res.status(404).send('Пользователь не найден')
      }
      await client.close()
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },
  appendHistory: async (token, track, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('TracksHistory')
      const users = await client.db('Last-FM').collection('Users')
      const tracks =  await client.db('Last-FM').collection('Tracks')
      let trackInfo
      await tracks.findOne({_id: new ObjectId(track)}).then(response => {
        trackInfo = response
      })
      let userInfo
      await users.findOne({token: token}).then(response => {
        userInfo = response
      })
      if (userInfo !== null && trackInfo !== null) {
        await collection.insertOne({name: userInfo.token, track: track, datetime: new Date().toISOString(), _id: new ObjectId()})
        res.status(201).send('Успешно')
      } else if (userInfo === null) {
        res.status(401).send('Вы не авторизованы')
      } else {
        res.status(404).send('Трек не был найден.')
      }
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  }
}

module.exports = mongoHandler
