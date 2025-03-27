// pages/bookCourse/bookCourse.js
Page({
  data: {
    students: [],
    curCourse: '',

    dates: [],
    activeDate: '',
    timeSlots: [],
  },

  onLoad(options) {
    this.setData({ curCourse: options.courseType })
    console.log(this.data.curCourse)

    
  },

  GetDataFromServer(){
    wx.showLoading({
      title: '加载数据中..',
    })

    const db = wx.cloud.database();
    db.collection('config').doc('2b83cb1667e564ad00052bdf3b0596de').get({
      success: res => {
        wx.hideLoading();
        this.setData({ courses: res.data.CourseTypes });
        console.log(this.data.courses)
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '请求数据失败',
        })
        console.log(err);
      }
    })



    db.collection('bookings').doc('93aa0c2e67e284b10087930b525bcf57').get({
      success: res => {
        wx.hideLoading();
        this.setData({ students: res.data.students });
        console.log(this.data.students)
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

  InitPageData() {
    this.initTwoWeeksDates()
    this.loadTimeSlots()
  },

  // 初始化两周日期（排除周末）
  initTwoWeeksDates() {
    const dates = this.getWeekdaysFromToday();

    this.setData({
      dates: dates,
      activeDate: dates[0].date
    })
  },

  getWeekdaysFromToday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let dates = [];

    for (let i = 0; i <= 5 - dayOfWeek; i++) {
      if (dayOfWeek <= 5) {
        let date = new Date();
        date.setDate(today.getDate() + i);
        dates.push(this.formatDate(date));
      }
    }

    for (let i = 1; i <= 5; i++) {
      let date = new Date();
      date.setDate(today.getDate() + (8 - dayOfWeek) + (i - 1));
      dates.push(this.formatDate(date));
    }

    return dates;
  },

  formatDate(date) {
    return {
      day: ['周一', '周二', '周三', '周四', '周五'][date.getDay() - 1],
      date: date.toISOString().split('T')[0],
      displayDate: `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    };
  },

  // 修改加载逻辑
  loadTimeSlots() {
    const storedData = wx.getStorageSync('bookings') || {}
    const slots = this.generateTimeSlots()

    if (storedData[this.data.activeDate]) {
      slots.forEach((slot, index) => {
        slot.booked = storedData[this.data.activeDate][index].booked
      })
    }

    this.setData({ timeSlots: slots })
  },

  // 新增时间段过期检查
  generateTimeSlots() {
    const slots = []
    let startHour = 14
    let startMinute = 30

    // 获取当前时间
    const now = new Date()
    const isToday = this.data.activeDate === now.toISOString().split('T')[0]

    for (let i = 0; i < 6; i++) {
      const endHour = startHour + Math.floor((startMinute + 60) / 60)
      const endMinute = (startMinute + 60) % 60

      // 时间段是否已过期（仅检查今天）
      let expired = false
      if (isToday) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const slotStartMinutes = startHour * 60 + startMinute
        expired = slotStartMinutes < currentMinutes
      }

      slots.push({
        start: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
        end: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
        booked: false,
        expired: expired
      })

      startHour = endHour
      startMinute = endMinute
    }

    return slots
  },

  // 切换日期
  switchDate(e) {
    const date = e.currentTarget.dataset.date
    this.setData({ activeDate: date }, () => {
      this.loadTimeSlots()
    })
  },

  bookTime(e) {
    const index = e.currentTarget.dataset.index
    const slot = this.data.timeSlots[index]

    if (slot.booked || slot.expired) {
      wx.showToast({ title: '该时段不可预约', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认预约',
      content: `确定预约 ${this.data.timeSlots[index].start} - ${this.data.timeSlots[index].end} 时段吗？`,
      success: (res) => {
        if (res.confirm) {
          const key = `timeSlots[${index}].booked`
          this.setData({
            [key]: true
          }, () => {
            this.saveBooking()
          })
        }
      }
    })
  },
})