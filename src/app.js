import React, { Component } from 'react'
import { debounce } from 'lodash'
import { connect } from 'react-redux'

import SignalList from 'components/signals/list'

import { changeDimensions, toggleMode, setTime, setLocation } from 'reducers/ui'
import { load } from 'reducers/signals'

@connect(({ ui }) => ({
  mode: ui.get('mode'),
  isMobile: ui.get('isMobile'),
}), {
  changeDimensions,
  toggleMode,
  setTime,
  setLocation,
  load,
})
class App extends Component {

  componentWillMount () {
    this.props.load()
  }

  componentDidMount () {
    window.addEventListener('keypress', this.key)
    window.addEventListener('resize', this.resize)
    this.resize()

    const { setTime, setLocation } = this.props

    navigator.geolocation.watchPosition(
      ({ coords: { latitude, longitude } }) =>
        setLocation({ latitude, longitude })
    )

    this.interval = setInterval(setTime, 1E3)
  }

  componentWillUnmount () {
    window.removeEventListener('keypress', this.key)
    window.removeEventListener('resize', this.resize)
    clearInterval(this.interval)
  }

  key = e => {
    const { isMobile, toggleMode } = this.props
    if (isMobile || e.code !== 'Space' || !e.shiftKey) { return }
    toggleMode()
  }

  resize = debounce(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    this.props.changeDimensions({ width, height })
  }, 200)

  render () {

    const { mode, isMobile } = this.props

    if (mode === 'map' && !isMobile) {
      // Require here, so we do not even load deck.gl on mobile
      const Map = require('components/map.js').default
      return (<Map />)
    }

    return (<SignalList />)

  }

}

export default App
