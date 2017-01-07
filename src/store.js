import { createStore, applyMiddleware, compose } from 'redux'
import { taskMiddleware } from 'react-palm'

import reducers from 'reducers'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const mids = [taskMiddleware]
const store = createStore(reducers, {}, composeEnhancers(applyMiddleware(...mids)))

if (module.hot) {
  module.hot.accept('./reducers', () => {
    const nextRootReducer = require('./reducers').default
    store.replaceReducer(nextRootReducer)
  })
}

export default store
