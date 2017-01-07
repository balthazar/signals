import r from 'axios'
import turf from '@turf/turf'
import { writeFile } from 'fs'

import { getColor } from 'utils'
import getDB from 'api/db'
import enhanced from '../data/enhanced.json'

const signalUrl = 'https://data.sfgov.org/api/views/8xta-sna8/rows.json?accessType=DOWNLOAD'
const streetUrl = 'https://data.sfgov.org/api/views/7hfy-8sz8/rows.json?accessType=DOWNLOAD'

const crossKeys = Array(4).fill(0).map((v, i) => `cross_street_${i + 1}`)

/**
 * Transform shitty formatting into clean json
 */
const transform = (data, columns) =>
  data.map(signal => signal.reduce(
    (out, cur, i) => {
      const col = columns[i]
      const value = cur === ' ' ? null : cur
      const field = col.fieldName[0] === ':' ? col.name : col.fieldName

      out[field] = Array.isArray(value) ? value.reduce((out, cur, i) =>
        (out[col.subColumnTypes[i]] = cur, out),
        {}
      ) : value

      return out
    },
    {}
  ))

/**
 * Get data from SF API and format it
 */
const getLatest = (url, output) =>
  r(url).then(({ data: body }) => {
    const { meta: { view: { columns } }, data } = body
    return transform(data, columns)
  })
  .then(data => writeFile(output, JSON.stringify(data, null, 2)))

export const getLatests = () => {
  getLatest(signalUrl, 'data/signals.json')
  getLatest(streetUrl, 'data/streets.json')
}

const logJSON = (json, deep = 2) => console.log(JSON.stringify(json, null, deep)) // eslint-disable-line

export const enhance = () => {
  const streets = require('../data/streets.json')
  const signals = require('../data/signals.json')

  const coordsFromLineString = line =>
    line
      .replace(/^LINESTRING \((.*)\)$/, '$1')
      .split(', ')
      .map(p => p.split(' '))

  const [streetMap, fallBackMap] = streets.reduce((out, cur) => {
    if (!out[0][cur.streetname]) { out[0][cur.streetname] = [] }
    if (!out[1][cur.street]) { out[1][cur.street] = [] }

    const push = {
      cnn: Number(cur.cnntext),
      coords: coordsFromLineString(cur.geometry),
    }

    out[0][cur.streetname].push(push)
    out[1][cur.street].push(push)

    return out

  }, [{}, {}])

  let unassigned = 0
  const enhanceStreet = (signal, k) => {

    const name = signal[k]
    if (!name) { return null }

    const key = name.split(' - ')[0]
      .replace('22ND STREET', '22ND')
      .replace('TERRY FRANCOIS', 'TERRY A FRANCOIS')
      .replace('14TH AVENUE', '14TH AVE')
      .replace('NIAGRA', 'NIAGARA')
      .replace('BLYTHEDALE', 'BLYTHDALE')
      .replace('ROSMOOR', 'ROSSMOOR')
      .replace(/ \(.*\)$/, '')
      .replace('\'', '')
      .toUpperCase()

    const res = streetMap[key] || fallBackMap[key] || null

    if (!res) {
      console.log(key) // eslint-disable-line
      ++unassigned
      return { name, geometry: null }
    }

    const point = turf.point([signal.geom.longitude, signal.geom.latitude])
    const center = turf.circle(point, 40, 20, 'meters')

    const sortedSegments = res.sort((a, b) => a.cnn - b.cnn).map(c => c.coords)
    const spread = sortedSegments.reduce((out, cur) => (out = [...out, ...cur], out), [])
    const routePoints = spread.reduce((out, cur) => (out.push([Number(cur[0]), Number(cur[1])]), out), [])
    const route = turf.lineString(routePoints)

    const { geometry } = (turf.intersect(center, route) || {})

    return { name, geometry }
  }

  const enhanced = signals.map(signal => {
    crossKeys.forEach(key => signal[key] = enhanceStreet(signal, key))
    return signal
  })

  console.log('Unassigned:', unassigned) // eslint-disable-line

  writeFile('data/enhanced.json', JSON.stringify(enhanced, null, 2))

}

/**
 * Filter signals based on actuation method
 */
export const relevantSignals = enhanced
  .filter(d =>
    !d.vehicle_actuation
    && !d.preemption_priority
    && !d.pedestrian_actuation
    && !d.detection_type
  )

/**
 * Create sid index and write signals in db
 */
export const writeInDB = async () => {

  const db = await getDB()

  db.createIndex({ sid: 1 }, { unique: true, background: true, w: 1 })

  const signals = relevantSignals.map(signal => ({
    sid: signal.sid,
    updated: new Date(signal.updated_at * 1E3),
    streets: crossKeys.map(key => signal[key]).filter(s => s),
    location: {
      latitude: Number(signal.geom.latitude),
      longitude: Number(signal.geom.longitude),
    },
  }))

  return await db.insertMany(signals)

}

export const refineCycles = async () => {

  const db = await getDB()

  const signals = await db.find().toArray()
  signals.forEach(signal => {
    const cycles = signal.streets.filter(s => s.cycle)
    if (!cycles.length) { return }

    signal.streets.forEach(async (street, index) => {
      if (!street.cycle) { return }

      let { cycle } = street

      const duration = cycle.end - cycle.green
      const roundedDuration = Math.round(duration / 5E3) * 5E3

      if (duration < roundedDuration) {
        // We need to add some ms
        const durationDiff = roundedDuration - duration
        const partTime = Math.floor(durationDiff / 2)
        const remainer = durationDiff - (partTime * 2)

        cycle.yellow += partTime
        cycle.red += (partTime + remainer)
        cycle.end = cycle.green + roundedDuration
      } else if (duration > roundedDuration) {
        // We need to remove some ms
        const durationDiff = duration - roundedDuration
        const partTime = Math.floor(durationDiff / 2)
        const remainer = durationDiff - (partTime * 2)

        cycle.yellow -= partTime
        cycle.red -= (partTime + remainer)
        cycle.end = cycle.green + roundedDuration
      }

      const validateGreens = curCycle => {
        const allGreen = street.greens
          .concat([cycle.green, cycle.green + 1E3, cycle.yellow - 1E3])
          .map(t => getColor(t, curCycle, 'text'))
          .every(e => e === 'green')

        return allGreen
      }

      const valids = []
      if (street.greens && !street.calibrated) {

        process.stdout.write(`Starting ${street.name} (${signal.sid}): `)

        let tmpCycle = cycle
        let i = 0

        while (i < 100E3) {

          if (validateGreens(tmpCycle, i)) {
            valids.push(tmpCycle)
          }

          tmpCycle = {
            green: tmpCycle.green -= 1,
            yellow: tmpCycle.yellow -= 1,
            red: tmpCycle.red -= 1,
            end: tmpCycle.end -= 1,
          }
          ++i
        }

        if (valids.length) {

          street.calibrated = true

          const [minute] = valids
            .map(v => new Date(v.green).getMinutes())
            .filter((v, index, self) => self.indexOf(v) === index)

          const minFiltered = valids
            .filter(v => new Date(v.green).getMinutes() === minute)

          const median = minFiltered[Math.floor(minFiltered.length / 2)]
          cycle = median

          process.stdout.write('OK\n')

        } else {
          process.stdout.write('FAIL\n')
        }

      }

      await db.updateOne({ sid: signal.sid }, { $set: {
        [`streets.${index}.cycle`]: cycle,
        [`streets.${index}.calibrated`]: street.calibrated,
      } })

    })
  })

}

refineCycles()
  .then(() => setTimeout(() => process.exit(), 10E3))
