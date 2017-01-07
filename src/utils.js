import turf from '@turf/turf'

// const reduce = data.reduce((out, cur) => {
//   if (out[cur.equipment_type_type]) { return out }
//   out[cur.equipment_type] = cur.equipment_type
//   return out
// }, {})

/**
 * Grab all geometries from passed signals
 */
export const deckglTransform = signals => signals
  .reduce((out, cur, index) => {

    const { sid, streets } = cur

    streets.forEach(street => {
      if (street.geometry) {
        out.push({ sid, index, ...street })
      }
    })

    return out

  }, [])

/**
 * Filter and sort relevant signals based on search text by
 * attributing them a score based on cross streets names.
 */
export const filterSignals = (signals, search, coords, isMobile) => signals
  .map(signal => {
    signal.score = 0

    signal.streets.forEach(street => {
      const name = street.name.toLowerCase()

      search.toLowerCase().split(' ').forEach(part => {
        const match = name.includes(part)
        if (match) {
          signal.score = signal.score ? signal.score * 2 : 1
        }
      })
    })

    return signal
  })
  .filter(s => s.score)
  .filter(s => {
    if (!isMobile) { return true }
    const here = turf.point([coords.get('longitude'), coords.get('latitude')])
    const point = turf.point([s.location.longitude, s.location.latitude])
    const distance = turf.distance(here, point, 'meters')
    return distance <= 200
  })
  .sort((a, b) => b.score - a.score)

export const colors = {
  rgb: {
    unset: [38, 139, 210],
    green: [133, 153, 0],
    yellow: [181, 137, 0],
    red: [220, 50, 47],
  },
  hex: {
    unset: '#268BD2',
    green: '#859900',
    yellow: '#B58900',
    red: '#DC322F',
  },
  text: {
    unset: 'unset',
    green: 'green',
    yellow: 'yellow',
    red: 'red',
  },
}

export const getColor = (time, cycle, format = 'rgb') => {

  if (!cycle || !cycle.green) { return colors[format].unset }

  const diff = time - cycle.green
  const duration = cycle.end - cycle.green
  const base = Math.floor(diff / duration) * duration
  const current = diff - base

  if (current < cycle.yellow - cycle.green) {
    return colors[format].green
  } else if (current < cycle.red - cycle.green) {
    return colors[format].yellow
  }

  return colors[format].red
}

export const humanDate = date =>
  `${date.toDateString()} ${date.toTimeString().substr(0, 8)}`
