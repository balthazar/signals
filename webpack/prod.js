import webpack from 'webpack'
import { resolve } from 'path'

import config from '.'

export default {

  ...config,

  module: {

    ...config.module,

    loaders: [...config.module.loaders, {
      test: /\.js$/,
      loader: 'babel-loader',
      include: resolve(__dirname, '../src'),
    }],

  },

  plugins: [
    ...config.plugins,
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false },
    }),
  ],

  stats: {
    colors: true,
    timings: true,
    reasons: false,
  },

}
