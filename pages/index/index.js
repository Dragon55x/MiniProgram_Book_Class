Page({
    data: {
      name: '',
      email: '',
      course: '',
      date: '',
      message: ''
    },
    bindNameInput: function(e) {
      this.setData({
        name: e.detail.value
      });
    },
    bindEmailInput: function(e) {
      this.setData({
        email: e.detail.value
      });
    },
    bindCourseChange: function(e) {
      this.setData({
        course: e.detail.value
      });
    },
    bindDateChange: function(e) {
      this.setData({
        date: e.detail.value
      });
    },
    formSubmit: function() {
      const { name, email, course, date } = this.data;
      if (!name || !email || !course || !date) {
        wx.showToast({
          title: 'Please fill in all fields',
          icon: 'none'
        });
        return;
      }
  
      // Here you can add logic to send the booking data to a server or store it locally
      console.log(`Booking made by ${name} (${email}) for ${course} on${date}`);
  
      this.setData({
        message: 'Your booking has been successfully submitted!',
        name: '',
        email: '',
        course: '',
        date: ''
      });
  
      wx.showToast({
        title: 'Success',
        icon: 'success'
      });
    }
  });