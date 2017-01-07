import React, { Component } from 'react'
import { connect } from 'react-redux'
import { debounce } from 'lodash'

import { filter } from 'reducers/ui'

@connect(({ ui }) => ({
  defaultValue: ui.get('filter'),
}), {
  filter,
})
class Search extends Component {

  search = debounce(() => this.props.filter(this._input.value), 500)

  render () {
    return (

      <div
        style={{
          height: 50,
          padding: 10,
          borderBottom: '1px solid #E9E9E9',
        }}>

        <input
          defaultValue={this.props.defaultValue}
          type='text'
          placeholder='Search'
          ref={i => this._input = i}
          onChange={this.search}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            fontSize: 25,
            fontWeight: 'lighter',
          }} />

      </div>
    )
  }

}

export default Search
