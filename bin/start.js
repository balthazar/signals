import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'

import config from '../webpack/dev'

const devConfig = {
  hot: true,
  noInfo: true,
  historyApiFallback: true,
  progress: true,
}

new WebpackDevServer(webpack(config), devConfig)
  .listen(3000, 'localhost', err => {
    if (err) { return console.error(err) } // eslint-disable-line
    console.log('Webpack listening on port 3000') // eslint-disable-line
  })
