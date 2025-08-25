import base from './webpack.base';
import { merge } from 'webpack-merge';

import {getSites} from '@yueris/sites';

const sites = getSites('production');
const yueris = sites['index'];

export default merge({
    mode: "production",
    plugins: [
        new webpack.DefinePlugin({
            "process.site.CANVAS": JSON.stringify(`${yueris.protocol}://${yueris.host}:${yueris.port}`)
        })
    ]
},base)
