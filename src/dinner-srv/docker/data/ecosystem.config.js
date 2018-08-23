const dinner = {
  name: 'dinner-srv',
  script: 'build/www.js',
  watch: false,
  cwd: "/opt/workspace/dinner-srv"
}

module.exports = {
  apps: [
    dinner
  ],
  max_restarts: 1000000
};
