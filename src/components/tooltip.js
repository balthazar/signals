import React, { Component } from 'react'
import { connect } from 'react-redux'

import { colors, getColor } from 'utils'
import { toggleHelp } from 'reducers/ui'

@connect(({ ui }) => ({
  help: ui.get('help'),
  time: ui.get('time'),
}), {
  toggleHelp,
})
class Tooltip extends Component {

  render () {

    const { signal, time, help, toggleHelp } = this.props

    if (signal) {

      return (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0, 0, 0, 0.4)',
            color: 'rgba(255, 255, 255, 0.8)',
            padding: 10,
          }}>

          <h3 style={{ marginBottom: 10 }}>
            {signal.get('sid')}
          </h3>

          {signal.get('streets').map(street => {

            if (!street.getIn(['cycle', 'green'])) {
              return (
                <div key={street.get('name')}>
                  <h3 style={{ color: getColor(time, null, 'hex') }}>{street.get('name')}</h3>
                </div>
              )
            }

            const cycle = street.get('cycle').toJS()

            const diff = time - cycle.green
            const duration = cycle.end - cycle.green
            const base = Math.floor(diff / duration) * duration
            const current = diff - base

            const greenTime = cycle.yellow - cycle.green
            const yellowTime = cycle.red - cycle.yellow + greenTime
            const redTime = cycle.end - cycle.red + yellowTime

            return (
              <div key={street.get('name')} style={{ width: 200 }}>

                <h3 style={{ color: getColor(time, cycle, 'hex') }}>{street.get('name')}</h3>

                <div style={{ marginTop: 5, marginBottom: 5 }}>
                  {`(${street.get('calibrated') ? '' : 'not '}calibrated)`}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{'duration: '}</span>
                  <span>{`${duration / 1E3}s`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{'current:'}</span>
                  <span>{`${current / 1E3}s`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{'green:'}</span>
                  <span>{`${greenTime / 1E3}s`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{'yellow:'}</span>
                  <span>{`${yellowTime / 1E3}s (${(cycle.red - cycle.yellow) / 1E3})`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{'red:'}</span>
                  <span>{`${redTime / 1E3}s (${(cycle.end - cycle.red) / 1E3})`}</span>
                </div>

              </div>
            )
          })}

        </div>
      )
    }

    return (
      <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>

        {help && (
          <div
            style={{
              position: 'absolute',
              bottom: 13,
              right: 10,
              padding: 10,
              background: 'rgba(0, 0, 0, 0.4)',
            }}>

            <div>
              <h3 style={{ marginBottom: 10 }}>{'SIGNALS'}</h3>

              <div style={{ marginBottom: 20 }}>
                <div>
                  <div style={{ height: 3, width: 10, background: colors.hex.green }} />
                  {'The signal is green'}
                </div>
                <div>
                  <div style={{ height: 3, width: 10, background: colors.hex.yellow }} />
                  {'The signal is switching to red soon'}
                </div>
                <div>
                  <div style={{ height: 3, width: 10, background: colors.hex.red }} />
                  {'The signal is red'}
                </div>
                <div>
                  <div style={{ height: 3, width: 10, background: colors.hex.unset }} />
                  {'The cycle is not yet defined'}
                </div>
                <div>
                  <div style={{ height: 3, width: 10, background: 'rgba(255, 255, 255, 0.5)' }} />
                  {'Transparent paths means the cycle is not calibrated'}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <p>
                  {'Street centerlines courtesy of '}
                  <a href='https://www.mapbox.com/about/maps' rel='noopener noreferrer' target='_blank'>{'SF Open Data'}</a>
                </p>
                <p>
                  {'Tiles provided by '}
                  <a href='https://data.sfgov.org' rel='noopener noreferrer' target='_blank'>{'Mapbox'}</a>
                </p>
              </div>

              <span style={{ marginRight: 30 }}>{'Imagined, Powered & Fingercrafted by the infamous Balthazar'}</span>

            </div>

          </div>
        )}

        <i
          onClick={() => toggleHelp()}
          className='ion-help-circled'
          style={{ position: 'absolute', right: 20, bottom: 20 }} />

      </div>
    )
  }

}

export default Tooltip
