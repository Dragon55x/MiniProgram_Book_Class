// pages/bookCourse/bookCourse.js
Page({
  data: {
    serverInfo:{
      students:[]
    },
    curCourse:''
  },

  onLoad(options){
    this.setData({curCourse: options.courseType})
    console.log(this.data.curCourse)
  }
})