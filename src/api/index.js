import express, { Router } from 'express'
import morgan from 'morgan'
import { json } from 'body-parser'

import { getColor } from 'utils'
import getDB from 'api/db'

const server = express()
const port = process.env.PORT || 3001
const isDev = process.env.NODE_ENV === 'development'

server.use(morgan('dev'))
server.use(json())

if (isDev) {
  server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    next()
  })
}

const routes = Router()

routes.get('/', (req, res) => res.send('Hello pal'))

routes.get('/signals', async (req, res) => {

  try {
    const db = await getDB()
    const docs = await db.find().toArray()
    res.status(200).send(docs)
  } catch (e) {
    res.sendStatus(500)
  }

})

routes.get('/signals/:sid/:street/status', async (req, res) => {

  try {

    const db = await getDB()
    const sid = Number(req.params.sid)
    const doc = await db.findOne({ sid })

    if (!doc) { return res.sendStatus(404) }

    const index = doc.streets.map(s => s.name).indexOf(req.params.street)
    if (index === -1) { return res.sendStatus(400) }

    const cycle = doc.streets[index].cycle
    const time = Number(req.query.time)

    const color = getColor(time, cycle, 'text')
    res.status(200).send(color)

  } catch (e) {
    res.sendStatus(500)
  }

})

routes.put('/signals/:sid/:street/cycle', async (req, res) => {

  try {

    const db = await getDB()
    const sid = Number(req.params.sid)
    const doc = await db.findOne({ sid })

    if (!doc) { return res.sendStatus(404) }

    const { cycle } = req.body
    const index = doc.streets.map(s => s.name).indexOf(req.params.street)
    if (index === -1) { return res.sendStatus(400) }

    await db.updateOne({ sid }, { $set: { [`streets.${index}.cycle`]: cycle } })

    res.sendStatus(200)

  } catch (e) {
    res.sendStatus(500)
  }

})

routes.put('/signals/:sid/:street/greens', async (req, res) => {

  try {

    const db = await getDB()
    const sid = Number(req.params.sid)
    const doc = await db.findOne({ sid })

    if (!doc) { return res.sendStatus(404) }

    const { time } = req.body
    const index = doc.streets.map(s => s.name).indexOf(req.params.street)
    if (index === -1) { return res.sendStatus(400) }

    await db.updateOne({ sid }, { $push: { [`streets.${index}.greens`]: time } })

    res.sendStatus(200)

  } catch (e) {
    res.sendStatus(500)
  }

})

routes.delete('/signals/:sid/:street/greens/last', async (req, res) => {

  try {

    const db = await getDB()
    const sid = Number(req.params.sid)
    const doc = await db.findOne({ sid })

    if (!doc) { return res.sendStatus(404) }

    const index = doc.streets.map(s => s.name).indexOf(req.params.street)
    if (index === -1) { return res.sendStatus(400) }

    await db.updateOne({ sid }, { $pop: { [`streets.${index}.greens`]: 1 } })

    res.sendStatus(200)

  } catch (e) {
    res.sendStatus(500)
  }

})

server.use(isDev ? '/' : '/api', routes)

server.listen(port, () => console.log(`[API] up on ${port}`)) // eslint-disable-line
