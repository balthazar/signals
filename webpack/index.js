import webpack from 'webpack'
import { resolve } from 'path'

const env = process.env.NODE_ENV || 'development'

export default {

  entry: ['./src'],

  output: {
    path: resolve(__dirname, '../dist'),
    filename: 'bundle.js',
  },

  resolve: {
    alias: {
      webworkify: 'webworkify-webpack-dropin',
      'gl-matrix': resolve('./node_modules/gl-matrix/dist/gl-matrix.js'),
    },
  },

  module: {

    loaders: [{
      test: /\.json$/,
      loader: 'json-loader',
    }],

    postLoaders: [{
      include: /node_modules\/mapbox-gl/,
      loader: 'transform',
      query: 'brfs',
    }],

  },

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(env),
        BROWSER: JSON.stringify(true),
      },
    }),
  ],

  node: {
    fs: 'empty',
  },

}
