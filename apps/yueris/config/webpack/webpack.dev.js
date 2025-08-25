import path from 'path';
import base from './webpack.base.js';
import webpack from 'webpack';
import { merge } from 'webpack-merge';

import {getSites} from '@yueris/sites';

const sites = getSites('development');
const yueris = sites['index'];
const canvas = sites['canvas'];

const __dirname = path.resolve();

export default merge({
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        static: { directory: path.resolve(__dirname, '../../public') },
        port: yueris.port,
        open: '/index.html',
        historyApiFallback: true,
        host: yueris.host,
      },
    plugins: [
        new webpack.DefinePlugin({
            "process.site.CANVAS": JSON.stringify(`${canvas.protocol}://${canvas.host}:${canvas.port}`)
        })
    ]
}, base)
