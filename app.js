// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-6gin37d229476d99',
      traceUser: true,
    });
  },
  globalData: {
    CourseTypes: ['钢琴', '古筝', '吉他', '声乐','瑜伽','民族舞'],
    CourseTime: ['15:00-16:00','17:00-18:00','15:00-16:00','15:00-16:00']
  }
})
