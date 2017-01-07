import { MongoClient } from 'mongodb'

const url = 'mongodb://localhost:27017/signals'

let db = null

export default async () => {
  if (db) { return db }
  const tmp = await MongoClient.connect(url)
  db = tmp.collection('signals')
  return db
}
