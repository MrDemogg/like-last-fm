const {MongoClient, ObjectId} = require('mongodb')
const {v4} = require('uuid')
const bcrypt = require('bcrypt');

const client = new MongoClient('mongodb://localhost:27017')

const mongoHandler = {
  userTests: async (token) => {
    const users = await client.db('Last-FM').collection('Users')
    const isUserLogged = await users.findOne({token: token})
    if (isUserLogged !== null) {
      return {success: true, status: 200, text: 'Успешно'}
    }
    return {success: false, status: 403, text: 'Пользователь не авторизован'}
  },
  ifElementExists: async (collection, params) => {
    return await collection.findOne(params) !== null;
  },
  insertArtist: async (name, photo, info, token, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Artists')
      const userInfo = await mongoHandler.userTests(token)
      if (userInfo.success) {
        await collection.insertOne({name: name, photo: photo, info: info, _id: new ObjectId()})
      }
      res.status(userInfo.status).send(userInfo.text)
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
  insertAlbums: async (name, artist, year, photo, token, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Albums')
      const artists = await client.db('Last-FM').collection('Artists')
      const userInfo = await mongoHandler.userTests(token)
      if (userInfo.success) {
        if (await mongoHandler.ifElementExists(artists, {artist: artist})) {
          await collection.insertOne({name: name, artist: artist, year: year, photo: photo, _id: new ObjectId()})
        } else {
          res.status(404).send('Нельзя создать альбом с несуществующим автором')
        }
      } else {
        res.status(userInfo.status).send(userInfo.text)
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
  insertTrack: async (name, duration, album, music, token, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Tracks')
      const albums = await client.db('Last-FM').collection('Albums')
      const userInfo = await mongoHandler.userTests(token)
      if (userInfo.success) {
        if (await mongoHandler.ifElementExists(albums, {name: album})) {
          await collection.insertOne({name: name, album: album, duration: duration, music: music})
        } else {
          res.status(404).send('Нельзя создать трек с несуществующим альбомом')
        }
      } else {
        res.status(userInfo.status).send(userInfo.text)
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
      const profile = await collection.findOne({username: username})
      if (profile && 'username' in profile && username === profile.username) {
        res.status(403).send('Пользователь с таким username уже существует')
      } else {
        let securePassword
        await bcrypt.hash(password, 2).then(function(hash) {
          securePassword = hash
        });
        await collection.insertOne({username: username, password: securePassword, _id: new ObjectId()}).then()
        res.status(201).send('Успешно')
      }
      await client.close()
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
        })
        if (isPasswordCorrect) {
          await collection.updateOne(
            {username: username, password: profile.password},
            {$set: {token: token}}).then(() => {
              res.status(201).send(token)
            }
          )
        } else {
          res.status(418).send('Неправильный пароль пупсик')
        }
      } else {
        res.status(404).send('Пользователь не найден')
      }
      await client.close()
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },
  logout: async (username, token, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('Users')
      const userInfo = await mongoHandler.userTests(token)
      if (userInfo.success) {
        await collection.updateOne({username: username, token: token}, {$unset: {token: ''}})
      }
      res.status(userInfo.status).send(userInfo.text)
      await client.close()
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },
  appendHistory: async (token, track, res) => {
    try {
      await client.connect()
      const collection = await client.db('Last-FM').collection('TracksHistory')
      const tracks =  await client.db('Last-FM').collection('Tracks')
      let trackInfo
      await tracks.findOne({_id: new ObjectId(track)}).then(response => {
        trackInfo = response
      })
      const userInfo = await mongoHandler.userTests(token)
      if (userInfo.success && trackInfo !== null) {
        await collection.insertOne({user: token, track: track, datetime: new Date().toISOString(), _id: new ObjectId()})
        res.status(200)
      } else if (trackInfo === null) {
        res.status(404).send('Трек не был найден.')
      } else {
        res.status(userInfo.status).send(userInfo.text)
      }
      await client.close()
    } catch (e) {
      res.status(500).send('Ошибка')
    }
  },

}

module.exports = mongoHandler
