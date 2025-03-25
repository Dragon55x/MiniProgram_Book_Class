const app = getApp();

Page({
  data: {
    courses: app.globalData.CourseTypes
  },

  navigateToDetail(e){
    const courseType = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/bookCourse/bookCourse?courseType=${courseType}`,
    })
  }
})