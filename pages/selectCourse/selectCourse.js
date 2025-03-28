Page({
  data: {
    courses: []
  },

  onLoad(){
    wx.showLoading({
      title: '加载数据中..',
    })

    const db = wx.cloud.database();
    db.collection('config').doc('2b83cb1667e564ad00052bdf3b0596de').get({
      success: res => {
        wx.hideLoading();
        this.setData({ courses: res.data.CourseTypes });
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '请求数据失败',
        })
        console.log(err);
      }
    })
  },

  navigateToDetail(e){
    const courseType = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/bookCourse/bookCourse?courseType=${courseType}`,
    })
  }
})