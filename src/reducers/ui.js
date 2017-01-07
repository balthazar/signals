import { handleActions, createAction } from 'redux-actions'
import { Map, fromJS } from 'immutable'

export const initialState = Map({

  isMobile: (/iPhone|Android/i).test(navigator.userAgent),

  filter: '',

  selectedSignal: null,
  selectedStreet: null,

  time: Date.now(),

  mode: 'map',
  help: true,

  width: 5000,
  height: 5000,

  coords: Map(),

  viewport: Map({
    latitude: 37.785164,
    longitude: -122.41669,
    zoom: 16.140440,
    bearing: -20.55991,
    pitch: 60,
  }),

})

export const selectStreet = createAction('SELECT_STREET')
export const selectSignal = createAction('SELECT_SIGNAL')

export const toggleHelp = createAction('TOGGLE_HELP')
export const toggleMode = createAction('TOGGLE_MODE')

export const filter = createAction('FILTER')
export const changeDimensions = createAction('CHANGE_DIMENSIONS')
export const changeViewport = createAction('CHANGE_VIEWPORT')

export const setLocation = createAction('SET_LOCATION')
export const setTime = createAction('SET_TIME')

export default handleActions({

  SELECT_SIGNAL: (state, { payload: signal }) => state
    .set('selectedSignal', fromJS(signal))
    .set('selectedStreet', null),

  SELECT_STREET: (state, { payload: street }) => state.set('selectedStreet', street),

  CHANGE_DIMENSIONS: (state, { payload: { width, height } }) =>
    state.merge({ width, height }),

  CHANGE_VIEWPORT: (state, { payload: viewport }) =>
    state.set('viewport', Map(viewport)),

  FILTER: (state, { payload }) => state.set('filter', payload),

  SET_TIME: state => state.set('time', Date.now()),
  SET_LOCATION: (state, { payload: coords }) => state.set('coords', fromJS(coords)),

  TOGGLE_MODE: state => state.set('mode', state.get('mode') === 'map' ? 'admin' : 'map'),
  TOGGLE_HELP: state => state.set('help', !state.get('help')),

  PUSH_GREEN_SUCCESS: (state, { payload: { payload: { sid, street, time } } }) => {
    const signal = state.get('selectedSignal')
    const isCurrent = sid === signal.get('sid')
    if (!isCurrent) { return state }

    const index = signal.get('streets').map(s => s.get('name')).indexOf(street)
    if (index === -1) { return state }
    return state.updateIn(['selectedSignal', 'streets', index, 'greens'], greens => greens.push(time))
  },
  POP_GREENS_SUCCESS: (state, { payload: { payload: { sid, street } } }) => {
    const signal = state.get('selectedSignal')
    const isCurrent = sid === signal.get('sid')
    if (!isCurrent) { return state }

    const index = signal.get('streets').map(s => s.get('name')).indexOf(street)
    if (index === -1) { return state }
    return state.updateIn(['selectedSignal', 'streets', index, 'greens'], greens => greens.pop())
  },

}, initialState)
