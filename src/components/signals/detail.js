import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Map, List } from 'immutable'

import { setCycle, resetCycle, updateCycle, pushGreen, popGreens } from 'reducers/signals'
import { selectSignal, selectStreet } from 'reducers/ui'
import { humanDate } from 'utils'

import Button from 'components/button'

const cycleSuccessors = {
  green: 'yellow',
  yellow: 'red',
  red: 'end',
}

const cycleColors = {
  green: '#859900',
  yellow: '#B58900',
  red: '#DC322F',
}

const rowStyle = {
  display: 'flex',
  marginTop: '1em',
  marginBottom: '1em',
  width: '100%',
  justifyContent: 'center',
}

@connect(({ ui, signals }) => ({
  signal: ui.get('selectedSignal'),
  selectedStreet: ui.get('selectedStreet'),
  cycle: signals.get('cycle'),
}), {
  selectSignal,
  selectStreet,
  updateCycle,
  setCycle,
  resetCycle,
  pushGreen,
  popGreens,
})
class SignalDetail extends Component {

  getStreetBox = street => {

    const { selectedStreet, selectStreet } = this.props
    const name = street.get('name')
    const hasGeo = !!street.get('geometry')
    const selected = selectedStreet === name

    return (
      <Button
        onClick={() => selectStreet(selected ? null : name)}
        disabled={!hasGeo}
        selected={selected}
        style={{ margin: 5, minWidth: 250 }}
        key={name}>
        {name}
      </Button>
    )
  }

  updateCycle = () => {
    const { signal, selectedStreet, updateCycle } = this.props
    if (!selectedStreet || this.props.cycle.size !== 4) { return }

    const sid = signal.get('sid')
    const cycle = this.props.cycle.toJS()

    updateCycle({ sid, street: selectedStreet, cycle })
  }

  pushGreen = () => {
    const { signal, selectedStreet, pushGreen } = this.props
    const sid = signal.get('sid')
    pushGreen({ sid, street: selectedStreet, time: Date.now() })
  }

  popGreens = () => {
    const { signal, selectedStreet, popGreens } = this.props
    const sid = signal.get('sid')
    popGreens({ sid, street: selectedStreet })
  }

  render () {

    const {
      signal,
      cycle,
      setCycle,
      resetCycle,
      selectSignal,
      selectedStreet,
    } = this.props

    const street = selectedStreet
      ? signal.get('streets').find(s => s.get('name') === selectedStreet)
      : null

    const greens = street ? street.get('greens') : List()
    const savedCycle = street ? street.get('cycle') : Map()
    const currentCycle = cycle.size ? cycle : savedCycle

    return (
      <div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 50,
            padding: 20,
            borderBottom: '1px solid #E9E9E9',
          }}>
          <i onClick={() => selectSignal()} className='ion-close-round' />
          <span
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
            }}>
            {signal.get('sid')}
          </span>
        </div>

        <div style={{ padding: '1em 2em' }}>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {signal.get('streets').map(this.getStreetBox)}
          </div>

          {selectedStreet && (
            <div
              style={{
                marginTop: '2em',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
              }}>

              <p>
                {'Start recording by clicking the following button each time the light changes, starting at green.'}
              </p>

              <h3 style={{ marginTop: '1em' }}>{'Cycle'}</h3>

              <div style={rowStyle}>

                <Button
                  onClick={() => setCycle()}
                  style={{ maxWidth: 200 }}
                  leftIcon='ion-aperture'
                  disabled={cycle.size === 4}>
                  {'Record'}
                </Button>

                <Button
                  onClick={() => resetCycle()}
                  style={{ marginLeft: 5 }}
                  disabled={!cycle.size}
                  leftIcon='ion-refresh'>
                  {'Reset'}
                </Button>

                <Button
                  onClick={this.updateCycle}
                  disabled={cycle.size !== 4}
                  style={{ marginLeft: 5 }}
                  leftIcon='ion-checkmark'>
                  {'Save'}
                </Button>

              </div>

              <div>
                {currentCycle.entrySeq().map(([key, value]) => (
                  <div key={key}>
                    <span>{humanDate(new Date(value))}</span>
                    {currentCycle.get(cycleSuccessors[key]) && (
                      <span style={{ marginLeft: 10, color: cycleColors[key] }}>
                        {currentCycle.get(cycleSuccessors[key]) - value}{'ms'}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: '1em' }}>{'Greens'}</h3>

              <div style={rowStyle}>

                <Button
                  onClick={this.pushGreen}
                  style={{ marginLeft: 5 }}
                  leftIcon='ion-pinpoint'>
                  {'Mark'}
                </Button>

                <Button
                  onClick={this.popGreens}
                  style={{ marginLeft: 5 }}
                  leftIcon='ion-trash-a'>
                  {'Delete last'}
                </Button>

              </div>

              <div>
                {greens.map(g => (<div key={g}>{new Date(g).toString()}</div>))}
              </div>

            </div>
          )}

        </div>

      </div>
    )

  }

}

export default SignalDetail
