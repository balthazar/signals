import React, { Component } from 'react'
import { connect } from 'react-redux'
import DeckGL from 'deck.gl/react'
import MapGL from 'react-map-gl'

import { PathLayer } from 'layers'
import Tooltip from 'components/tooltip'

import { getColor, deckglTransform } from 'utils'
import { changeViewport, selectSignal } from 'reducers/ui'

const token = 'pk.eyJ1IjoiYXBlcmN1IiwiYSI6ImNpZ3M0ZDZ2OTAwNzl2bmt1M2I0dW1keTIifQ.I5BD9uEHdm_91TiyBEk7Pw'

@connect(({ ui, signals }) => ({
  width: ui.get('width'),
  height: ui.get('height'),
  time: ui.get('time'),
  viewport: ui.get('viewport').toJS(),
  signals: signals.get('data'),
  selectedSignal: ui.get('selectedSignal'),
}), {
  changeViewport,
  selectSignal,
})
class Map extends Component {

  clicked = ({ object }) => {
    const { signals, selectSignal } = this.props
    selectSignal(object && signals[object.index])
  }

  render () {

    const {
      signals,
      selectedSignal,
      width,
      height,
      time,
      viewport,
      changeViewport,
    } = this.props

    const layers = [
      new PathLayer({
        data: deckglTransform(signals),
        pickable: true,
        getColor: ({ cycle }) => getColor(time, cycle),
        getOpacity: (props) => props.calibrated ? 255 : 100,
      }),
    ]

    return (
      <MapGL
        {...viewport}
        mapStyle='mapbox://styles/mapbox/dark-v9'
        onChangeViewport={changeViewport}
        preventStyleDiffing={false}
        mapboxApiAccessToken={token}
        perspectiveEnabled
        width={width}
        height={height}>

        <DeckGL
          {...viewport}
          time={time}
          width={width}
          height={height}
          onLayerClick={this.clicked}
          layers={layers}
          debug />

        {selectedSignal && (<Tooltip signal={selectedSignal} />)}
        <Tooltip />

      </MapGL>
    )
  }

}

export default Map
