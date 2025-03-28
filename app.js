// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-6gin37d229476d99',
      traceUser: true,
    });
  }
})
