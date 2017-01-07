import 'babel-polyfill'
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import store from 'store'
import App from 'app'

const root = (
  <Provider store={store}>
    <App />
  </Provider>
)

render(root, document.getElementById('root'))
