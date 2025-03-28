Page({
    data: {
        students: [],
        curCourse: '',

        pageDates: [],
        pageCurActiveIndex: 0,

        courseSchedule: [],
        courseHours: [],
        courseMaxCount: [],
        courseTypes: []
    },

    onLoad(options) {
        this.setData({ curCourse: options.courseType })
        this.getDataFromServer(this.initPageData);
    },

    getDataFromServer(callback) {
        wx.showLoading({
            title: '加载数据中..',
        })
        this.getServerConfig(callback);
    },

    getServerConfig(callback) {
        const db = wx.cloud.database();
        db.collection('config').doc('2b83cb1667e564ad00052bdf3b0596de').get({
            success: res => {
                this.setData({ courseSchedule: res.data.CourseSchedule });
                this.setData({ courseHours: res.data.CourseHour });
                this.setData({ courseMaxCount: res.data.CourseMaxCount });
                this.setData({ courseTypes: res.data.CourseTypes });
                this.getServerData(callback);
            },
            fail: err => {
                wx.hideLoading();
                wx.showToast({
                    title: '请求数据失败',
                });
                console.log(err);
            }
        })
    },

    getServerData(callback) {
        const db = wx.cloud.database();
        db.collection('bookings').doc('93aa0c2e67e284b10087930b525bcf57').get({
            success: res => {
                wx.hideLoading();
                this.setData({ students: res.data.students });
                callback();
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

    initPageData() {
        this.initTwoWeeksDates()
        this.loadTimeSlots()
    },

    initTwoWeeksDates() {
        const dates = this.getWeekdaysFromToday();
        this.fillHoursToDates(dates);
        this.setData({ pageDates: dates, })
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

        const scheduleDays = this.data.courseSchedule[this.data.curCourse].map(item => item.dayOfWeek);
        const scheduleDaysUnique = Array.from(new Set(scheduleDays));
        return dates.filter(d => scheduleDaysUnique.includes(d.day));
    },

    fillHoursToDates(dates) {
        const bookedCourseStudents = this.data.students.filter(s => s.course == this.data.curCourse);
        dates.forEach(d => {
            const schedule = this.data.courseSchedule[this.data.curCourse].filter(s => s.dayOfWeek == d.day);
            schedule.forEach(s => {
                const courseIndex = this.data.courseTypes.indexOf(this.data.curCourse);
                const maxCount = this.data.courseMaxCount[courseIndex];
                const hourInfo = this.formatHour(s.time, maxCount, maxCount);
                d.courseHours.push(hourInfo);
            })

            bookedCourseStudents.forEach(student => {
                if (student.orderTime.find(d1 => this.isSameDay(d1, d.date)) != undefined) {
                    const courseHour = d.courseHours.find(c => c.hourIndex == student.time);
                    if (courseHour != undefined) {
                        courseHour.canBookCount--;
                    }
                }
            })
        });
    },

    formatDate(date) {
        return {
            day: date.getDay() - 1,
            date: date,
            dayDesc: ['周一', '周二', '周三', '周四', '周五'][date.getDay() - 1],
            dateDesc: `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
            courseHours: []
        };
    },

    formatHour(hourIndex, maxCount, canBookCount) {
        return {
            hourIndex: hourIndex,
            maxCount: maxCount,
            canBookCount: canBookCount
        }
    },

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    },

    //page operation
    switchDate(e) {
        const index = e.currentTarget.dataset.index
        this.setData({ pageCurActiveIndex: index });
    },

    bookTime(e) {
        const hourIndex = e.currentTarget.dataset.hourindex
        const date = this.data.pageDates[this.data.pageCurActiveIndex];
        const courseHour = date.courseHours.find(c => c.hourIndex == hourIndex);
        if (courseHour == undefined) {
            wx.showToast({ title: '数据错误', icon: 'none' })
            return
        }
        if (courseHour.canBookCount <= 0) {
            wx.showToast({ title: '该时段人数已满，无法预约', icon: 'none' })
            return
        }

        this.showCheckInfoPopup(date, hourIndex, studenName => {
            this.postBookInfoToServer(date, hourIndex, studenName);
        });
    },

    postBookInfoToServer(date, hourIndex, studenName) {
        const info = {
            course: this.data.curCourse,
            name: studenName,
            orderTime: this.getNearFiveWeekdays(date.date),
            time: hourIndex
        };

        console.log(info);

        const db = wx.cloud.database();
        db.collection('bookings').doc('93aa0c2e67e284b10087930b525bcf57').update({
            data: {
                'students': db.command.push(info)
            }
        }).then(res => {
            this.refreshCurrentPage();
            console.log('上传成功', res)
        }).catch(err => {
            console.error('上传失败', err)
        })
    },

    getNearFiveWeekdays(inputDate) {
        const targetDayOfWeek = inputDate.getDay();
        const resultDates = [];

        resultDates.push(inputDate);

        for (let i = 1; i <= 4; i++) {
            const dateCopy = new Date(inputDate);
            dateCopy.setDate(dateCopy.getDate() + 7 * i);
            const currentDayOfWeek = dateCopy.getDay();
            const dayDifference = targetDayOfWeek - currentDayOfWeek;
            dateCopy.setDate(dateCopy.getDate() + dayDifference);
            resultDates.push(new Date(dateCopy));
        }

        return resultDates;
    },

    showCheckInfoPopup(date, hourIndex, callback) {
        wx.showModal({
            title: '请输入预约的学生姓名',
            editable: true,
            placeholderText: '姓名',
            success: (res) => {
                if (res.confirm) {
                    if (!res.content.trim()) {
                        wx.showToast({ title: '姓名不能为空', icon: 'none' });
                        return;
                    }
                    this.showConfirmDialog(date, hourIndex, res.content, callback);
                }
            }
        });
    },

    showConfirmDialog(date, hourIndex, name, callback) {
        wx.showModal({
            title: '确认是否预约',
            content: `课程名称：${this.data.curCourse} \n 开始日期：${date.dateDesc} \n 上课时间：${this.data.courseHours[hourIndex]}`,
            success: (res) => {
                if (res.confirm) {
                    callback(name);
                }
            }
        });
    },

    refreshCurrentPage() {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        currentPage.onLoad(currentPage.options);
        currentPage.onShow();
    }
})