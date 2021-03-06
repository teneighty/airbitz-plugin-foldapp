const path = require('path')

module.exports = {
  entry: './src/js/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './src/app/js')
  },
  module: {
    loaders: [{ test: /\.handlebars$/, loader: "handlebars-loader" }]
  }
}
