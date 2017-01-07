import React, { Component } from 'react'
import { connect } from 'react-redux'
import { List } from 'react-virtualized'

import { getColor, filterSignals } from 'utils'
import { selectSignal } from 'reducers/ui'

import SignalDetail from 'components/signals/detail'
import Search from 'components/signals/search'

@connect(({ ui, signals }) => ({
  width: ui.get('width'),
  height: ui.get('height'),
  search: ui.get('search'),
  signals: filterSignals(
    signals.get('data'),
    ui.get('filter'),
    ui.get('coords'),
    ui.get('isMobile'),
  ),
  selectedSignal: ui.get('selectedSignal'),
  time: ui.get('time'),
}), {
  selectSignal,
})
class SignalList extends Component {

  rowRenderer = ({ key, index, style }) => {
    const { time, signals, selectSignal } = this.props
    const signal = signals[index]

    return (
      <div
        key={key}
        onClick={() => selectSignal(signal)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 10,
          background: index % 2 ? 'transparent' : '#F8F8F9',
          height: 50,
          cursor: 'pointer',
          ...style,
        }}>

        <span>{signal.sid}</span>

        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginLeft: 10,
          }}>

          {signal.streets.map(street => (
            <span key={street.name} style={{ color: getColor(time, street.cycle, 'hex'), marginLeft: 5 }}>
              {street.name}
              {' '}
              {street.calibrated && <i className='ion-checkmark' />}
            </span>
          ))}

        </span>

      </div>
    )
  }

  render () {

    const { width, height, time, search, signals, selectedSignal } = this.props

    return (
      <div>
        {selectedSignal ? (
          <SignalDetail />
        ) : (
          <div>
            <Search />
            <List
              time={time}
              search={search}
              rowRenderer={this.rowRenderer}
              rowCount={signals.length}
              rowHeight={50}
              height={height - 50}
              width={width} />
          </div>
        )}
      </div>
    )

  }

}

export default SignalList
