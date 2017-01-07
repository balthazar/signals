import webpack from 'webpack'
import { resolve } from 'path'

import config from '.'

export default {

  ...config,

  devtool: 'source-maps',

  entry: [
    ...config.entry,
    'webpack/hot/dev-server',
    'webpack-dev-server/client?http://localhost:3000/',
  ],

  module: {

    ...config.module,

    loaders: [...config.module.loaders, {
      test: /\.js$/,
      loader: 'babel-loader',
      include: resolve(__dirname, '../src'),
      query: { presets: ['react-hmre'] },
    }],

  },

  plugins: [
    ...config.plugins,
    new webpack.HotModuleReplacementPlugin(),
  ],

}
