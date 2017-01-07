import r from 'axios'
import { makeTaskType, withTask } from 'react-palm'
import { createAction } from 'redux-actions'

const env = process.env.NODE_ENV
const apiRoot = {
  development: 'http://localhost:3001',
  production: 'https://signals.balthazargronon.com/api',
}

const XHR = props => ({ type: XHR, ...props })

const doRequest = payload => {

  const {
    url,
    method = 'get',
    headers,
    data: dataPayload,
    query,
  } = payload

  const rPayload = {
    url: `${apiRoot[env]}${url}`,
    method,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  }

  if (dataPayload) {
    rPayload.data = dataPayload
  }

  if (query) {
    rPayload.params = query
  }

  return r(rPayload)
    .then(({ data = {} }) => data)
}

const chain = (state, payload, ...modifiers) =>
  modifiers.reduce(
    (reduction, [modifier, value]) => modifier(reduction, value, payload),
    state
  )

const defaultModifier = state => state

export const apiHandlers = ({
  taskCreator,
  action,
  prevent = () => false,
  updatePrevent = defaultModifier,
  updateLoading = defaultModifier,
  updateLoaded = defaultModifier,
  updateData = defaultModifier,
  updateError = defaultModifier,
}) => {

  const onSuccess = createAction(`${action.toString()}_SUCCESS`)
  const onError = createAction(`${action.toString()}_ERROR`)

  return {
    [action]: (state, { payload }) => prevent(state, payload)
      ? updatePrevent(state, payload)
      : withTask(
        updateLoading(state, true, payload),
        XHR({
          error: data => onError({ payload, data }),
          success: data => onSuccess({ payload, data }),
          payload: taskCreator(state, payload),
        })
      ),
    [onSuccess]: (state, { payload: { data, payload } }) => chain(
      state,
      payload,
      [updateLoading, false],
      [updateLoaded, true],
      [updateData, data],
    ),
    [onError]: (state, { payload: { data, payload } }) => chain(
      state,
      payload,
      [updateLoading, false],
      [updateError, data],
    ),
  }
}

makeTaskType(XHR, (tasks, dispatch) =>
  Promise.all(
    tasks.map(task =>
      doRequest(task.payload)
        .then(response => dispatch(task.success(response)))
        .catch(err => dispatch(task.error(err)))
    )
  )
)

export default XHR
