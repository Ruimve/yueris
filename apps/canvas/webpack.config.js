import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
const __dirname = path.resolve();

/** @type {import('webpack').Configuration} */
export default {
  mode: 'development',
  entry: {
    preview: path.resolve(__dirname, 'src/app.tsx')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true,
    publicPath: '/'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults' }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  devServer: {
    static: { directory: path.resolve(__dirname, 'public') },
    port: 5174,
    historyApiFallback: true,
    host: '0.0.0.0',
    allowedHosts: 'all'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'preview.html',
      chunks: ['preview'],
      template: path.resolve(__dirname, 'public/preview.html'),
      inject: 'body'
    })
  ]
};


