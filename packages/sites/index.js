import index from './config/index.json' with { type: "json" };
import canvas from './config/canvas.json' with { type: "json" };;

export const getSites = (env) => {
    if(env === 'development') {
        return {
            index,
            canvas
        }
    }else {
        return {index};
    }
}