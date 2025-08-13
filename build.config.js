// build.config.js
module.exports = {
  build: {
    command: 'npm run build',
    environment: {
      NODE_VERSION: '18.17.0',
      NPM_VERSION: '9.x'
    }
  },
  install: {
    command: 'npm install'
  },
  start: {
    command: 'npm start'
  }
}