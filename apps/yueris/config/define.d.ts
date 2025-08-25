declare namespace NodeJS {
    interface Env {
      NODE_ENV: 'development' | 'production';
    }

    interface Site {
        CANVAS: string
    }
  }
  
  declare var process: {
    env: NodeJS.Env;
    site: NodeJS.Site
  };