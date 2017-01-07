import { handleActions, createAction } from 'redux-actions'
import { Map } from 'immutable'

import { apiHandlers } from 'tasks/xhr'

export const load = createAction('LOAD')
export const updateCycle = createAction('UPDATE_CYCLE')

export const setCycle = createAction('SET_CYCLE')
export const resetCycle = createAction('RESET_CYCLE')

export const pushGreen = createAction('PUSH_GREEN')
export const popGreens = createAction('POP_GREENS')

const cycleKeys = ['green', 'yellow', 'red', 'end']

const resetStateCycle = state => state.set('currentKey', 0).set('cycle', Map())

export const initialState = Map({

  // Do not use immutable for this stuff, perf issues
  data: [],

  cycle: Map(),
  currentKey: 0,

})

const loadHandlers = apiHandlers({
  taskCreator: () => ({ url: '/signals' }),
  updateData: (state, data) => state.set('data', data),
  action: load,
})

const updateStreet = (data, sid, street, fn) =>
  data.map(signal => {
    if (signal.sid !== sid) { return signal }

    signal.streets.forEach(s => {
      if (s.name !== street) { return }
      s = fn(s)
    })

    return signal

  })

const cycleHandlers = apiHandlers({
  taskCreator: (state, { sid, street, cycle }) => ({
    url: `/signals/${sid}/${street}/cycle`,
    method: 'put',
    data: { cycle },
  }),
  updateData: (state, data, { sid, street, cycle }) =>
    resetStateCycle(
      state.update('data', data =>
        updateStreet(data, sid, street, s => (s.cycle = cycle, s)))
    ),
  action: updateCycle,
})

const greenHandlers = apiHandlers({
  taskCreator: (state, { sid, street, time }) => ({
    url: `/signals/${sid}/${street}/greens`,
    method: 'put',
    data: { time },
  }),
  updateData: (state, data, { sid, street, time }) =>
    state.update('data', data => updateStreet(data, sid, street, s => {
      if (!s.greens) { s.greens = [] }
      s.greens.push(time)
      return s
    })),
  action: pushGreen,
})

const deleteGreenHandlers = apiHandlers({
  taskCreator: (state, { sid, street }) => ({
    url: `/signals/${sid}/${street}/greens/last`,
    method: 'delete',
  }),
  updateData: (state, data, { sid, street }) =>
    state.update('data', data => updateStreet(data, sid, street, s => {
      if (!s.greens) { s.greens = [] }
      s.greens.pop()
      return s
    })),
  action: popGreens,
})

export default handleActions({

  ...loadHandlers,
  ...cycleHandlers,
  ...greenHandlers,
  ...deleteGreenHandlers,

  SET_CYCLE: state => state
    .setIn(['cycle', cycleKeys[state.get('currentKey')]], Date.now())
    .update('currentKey', key => key === cycleKeys.length - 1 ? 0 : key + 1),

  SELECT_STREET: resetStateCycle,
  RESET_CYCLE: resetStateCycle,

}, initialState)
