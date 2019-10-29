<template>
  <div class="pMain" :style="{height: screenHeight+'px'}">

    <open-data type="userAvatarUrl" class="user-pic-head"></open-data>
    <div class="map-menu" :style="{top: screenHeight*0.4-30+'px'}" v-if="beginMakeActivity">
      <button class="btn-new-activity" type="default" size="default" :loading="false" :plain="false"
              :disabled="false"
              @click="startNewActivity">
        生成路线
      </button>
    </div>
    <div @click="clickHandle" class="map-border">
      <map
          id="map"
          style="width: 100%;height: 100%;"
          :longitude="userLocation.longitude"
          :latitude="userLocation.latitude"
          scale="10"
          :markers="markers"
          :polyline="polyline"
          :subkey="mapKey"
          @regionchange="regionchange"
          @start="regionchangestart"
          @end="regionchangeend"
          @markertap="markertap"
          @controltap="controltap"
          @poitap="poitap"
          @tap="maptap"
          show-location>
        <cover-view class="cover-view">
          <cover-image src="../../static/images/2.png" @click="putMark()"></cover-image>
        </cover-view>
      </map>
    </div>
    <div class="activity">
      <div class="swiper-div">
        <div class="page-title">
          <label>{{activityPage.title}}</label>
        </div>

        <div class="each-activity" v-if="!publishNewActivity">
          <div class="one-activity" @click="activityOnClick(activityIndex)"
               v-for="(oneActivity, activityIndex) in activityPage.activity" :key="activityIndex">
            <img class="user-pic" :src="oneActivity.author.avatarUrl">
            <label class="user-nic">{{oneActivity.author.nickName}}</label>
            <div class="activity-detail">
              <div class="activity_title-date">
                <div class="activity_title">{{oneActivity.title}}</div>
                <div class="activity_date"> {{oneActivity.localeString}}</div>
              </div>
              <div class="activity-intensity">
                {{oneActivity.intensity}}
              </div>
              <div class="activity-button">
                <button size="mini" open-type="getUserInfo" @getuserinfo="bindGetUserInfo">
                  参加
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="edit-activity" v-if="publishNewActivity">
        <input placeholder="活动介绍" v-model="activityEdit.title">
        <div>
          <picker mode="multiSelector" @change="bindMultiPickerChange"
                  @columnchange="bindMultiPickerColumnChange" :value="multiIndex" :range="multiArray">
            <view class="picker">
              活动时间选择：{{multiArray[0][multiIndex[0]]}}
              {{multiArray[1][multiIndex[1]]}}点{{multiArray[2][multiIndex[2]]}}分
            </view>
          </picker>
        </div>
        <input placeholder="活动强度介绍" v-model="activityEdit.intensity">
        <button class="btn-publish" size="mini" open-type="getUserInfo" @getuserinfo="publishActivity">
          确认发布
        </button>
        <button class="btn-cancel" size="mini" @click="cancelPublish()">
          取消
        </button>
      </div>
    </div>
  </div>

</template>

<script>
    import QQMapWx from '../../libs/qqmap-wx-jssdk.js'
    import {mapKey, mapSig} from '../../config/config.js'
    import {deepCopy, doLogin, post, get} from '../../utils/index.js'
    import {Activity} from "../../models/activity";

    const qqmapsdk = new QQMapWx({key: mapKey})

    export default {
        data() {
            return {
                currentHours: new Date().getHours(),
                currentMinute: new Date().getMinutes(),
                startDate: "请选择日期",
                multiIndex: [0, 0, 0],
                multiArray: [['今天', '明天', '后天'], [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], [0, 15, 30, 45]],
                activityEdit: {title: '', date: '', intensity: ''},
                publishNewActivity: false,
                beginMakeActivity: false,
                userInfo: {},
                canIUse: false,
                activityPage:
                    {
                        title: '人气Top',
                        activity: []
                    },
                screenHeight: 500,
                newPolyLine: [],
                centerLocation: {longitude: 0, latitude: 0},
                userLocation: {longitude: 121.49542406220225, latitude: 38.85084702209281},
                polygons: [],
                controls: [{
                    id: 1,
                    position: {
                        left: 0,
                        top: 300 - 50,
                        width: 50,
                        height: 50
                    },
                    clickable: true
                }],
                markers: [],
                polyline: [
                    {
                        points: [],
                        color: '#FF0000DD',
                        width: 6,
                        dottedLine: false
                    }
                ]

            }
        },
        mounted() {
            this.screenHeight = wx.getSystemInfoSync().windowHeight
            this.getActivityPage()
        },
        created() {
            doLogin()
            const that = this
            wx.getLocation({
                type: 'gcj02',
                success: function (res) {
                    const latitue = res.latitue
                    const longitude = res.longitude
                    that.latitude = latitue
                    that.longitude = longitude
                }
            })
        },
        onLoad() {
            const that = this
            wx.setNavigationBarTitle({title: '高性能单车活动'})
            wx.getSetting({
                success: function (res) {
                    that.canIUse = true
                    if (res.authSetting['scope.userInfo']) {
                        // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                        wx.getUserInfo({
                            success: function (res) {
                                console.log(res.userInfo)
                                that.userInfo = res.userInfo
                            }
                        })
                    }
                },
                fail: function (res) {
                    that.canIUse = false
                }
            })
        },
        onShow() {
            this.mapCtx = wx.createMapContext('map')
        },
        components: {},
        methods: {
            async getActivityPage() {
                const allActivity = await get('/getMainPageActivity/', {openid: wx.getStorageSync('openid')})
                this.activityPage.activity = []
                for (const item of allActivity) {
                    this.activityPage.activity.push(item.activityInfo)
                }
                if (this.activityPage.activity.length > 0) {
                    // this.getPolyLine(this.activityPage.activity[0].activityInfo.polyline.points)
                    // this.polyline = [this.activityPage.activity[0].polyline]
                }
                // for (const ac of this.activityPage.activity) {
                //     ac.activityDateString = this.getActivityTimeString(ac.activityDate)
                // }
            },
            cancelPublish() {
                this.publishNewActivity = false
                this.polyline = []
                this.markers = []
                this.newPolyLine = []
            },
            async publishActivity(res) {
                if (res.mp.detail.errMsg.indexOf('ok') >= 0) {
                    // success
                    wx.setStorageSync('userInfo', res.mp.detail.userInfo)
                    const userInfo = res.mp.detail.userInfo
                    userInfo['openid'] = wx.getStorageSync('openid')
                    const activityToAdd = new Activity()
                    activityToAdd.title = this.activityEdit.title
                    activityToAdd.intensity = this.activityEdit.intensity
                    // 解决polyline不刷新的问题
                    const tmp = deepCopy(this.polyline[0])
                    tmp.points.splice(1, 1)
                    activityToAdd.polyline = tmp
                    activityToAdd.activityDate = this.activityEdit.date
                    activityToAdd.localeString = new Date(this.activityEdit.date).toLocaleString()
                    activityToAdd.author = userInfo
                    activityToAdd.allMember.push(userInfo)
                    if (activityToAdd.title.length < 4 ||
                        activityToAdd.intensity < 1
                    ) {
                        wx.showToast({title: '请补全活动信息', icon: 'none', duration: 900})
                    }
                    if (activityToAdd.author['openid'].length < 6) {
                        doLogin()
                        activityToAdd.author['openid'] = wx.getStorageSync('openid')
                    }
                    const data = await post('/newActivity/', {
                        openid: activityToAdd.author['openid'],
                        userInfo: res.mp.detail.userInfo,
                        activityToAdd: activityToAdd
                    })
                    if (data.success) {
                        const tempArr = deepCopy(this.activityPage)
                        tempArr.activity.splice(0, 0, activityToAdd)
                        setTimeout(() => {
                            this.activityPage = tempArr
                        }, 100)
                    } else {
                        wx.showToast({title: '发布失败！', icon: 'none', duration: 900})
                    }
                } else {
                    // 拒绝
                    // todo
                }

                this.markers = []
                this.newPolyLine = []
                this.publishNewActivity = false
                // this.polyline[0].points = this.activityPage.activity[0].polyline.points
            },
            async takeActivity(activityIndex) {
                const userInfo = wx.getStorageSync('userInfo')
                const openid = wx.getStorageSync('openid')
                const activityId = this.activityPage.activity[activityIndex].activityId
                if (openid === '') {
                    return
                }
                const data = await post('/takeActivity/', {openid: openid, userInfo: userInfo, activityId: activityId})
                console.log('takeActivity post', data)
            },
            startNewActivity() {
                this.getPolyLine(deepCopy(this.markers))
                this.beginMakeActivity = false
                this.publishNewActivity = true
                this.bindMultiPickerChange({mp: {detail: {value: [0, 0, 0]}}})
            },
            bindGetUserInfo(res) {
                console.log(res)
                // success
                if (res.mp.detail.errMsg.indexOf('ok') >= 0) {
                    wx.setStorageSync('userInfo', res.mp.detail.userInfo)
                    this.takeActivity()
                } else {
                    // 拒绝
                    // todo
                }
            },
            activityOnClick(activityIndex) {
                this.polyline[0].points = deepCopy(this.activityPage.activity[activityIndex].polyline.points)
            },
            putMark() {
                const that = this
                let latitude = 0
                let longitude = 0
                this.mapCtx.getCenterLocation({
                    success: function (res) {
                        latitude = res.latitude
                        longitude = res.longitude
                        that.centerLocation.latitude = latitude
                        that.centerLocation.longitude = longitude
                        that.newPolyLine.push({
                            latitude: that.centerLocation.latitude,
                            longitude: that.centerLocation.longitude
                        })
                        that.markers.push({
                            latitude: that.centerLocation.latitude,
                            longitude: that.centerLocation.longitude,
                            iconPath: '../../static/images/3.png',
                            id: that.markers.length === 0 ? 1 : that.markers[that.markers.length - 1].id + 1,
                            width: 30,
                            height: 30
                        })
                        if (that.markers.length >= 2) {
                            that.beginMakeActivity = true
                        }
                    },
                    fail: function (onRejected) {
                        console.log(onRejected)
                    }
                })
            },
            getPolyLine(line) {
                const that = this
                let from = {latitude: line[0].latitude, longitude: line[0].longitude}
                let to = {latitude: line[line.length - 1].latitude, longitude: line[line.length - 1].longitude}
                let waypoints = ''
                line.splice(0, 1)
                line.splice(line.length - 1, 1)
                for (const point of line) {
                    waypoints += point.latitude + ',' + point.longitude + ';'
                }
                waypoints = waypoints.slice(0, -1)

                qqmapsdk.direction({
                    sig: mapSig,
                    mode: 'driving',
                    policy: 'AVOID_HIGHWAY',
                    from: from,
                    to: to,
                    waypoints: waypoints,
                    success: function (res) {
                        wx.hideLoading()
                        console.log(res)
                        const coors = res.result.routes[0].polyline
                        const pl = []
                        // 坐标解压（返回的点串坐标，通过前向差分进行压缩）
                        const kr = 1000000
                        for (let i = 2; i < coors.length; i++) {
                            coors[i] = Number(coors[i - 2]) + Number(coors[i]) / kr
                        }
                        // 将解压后的坐标放入点串数组pl中
                        for (let i = 0; i < coors.length; i += 2) {
                            pl.push({latitude: coors[i], longitude: coors[i + 1]})
                        }
                        that.polyline = []
                        that.polyline.push({
                            points: pl,
                            color: '#FF0000DD',
                            width: 6,
                            dottedLine: false
                        })
                    },
                    fail: function (err) {
                        console.log(err)
                        wx.hideLoading()
                    }
                })
            },
            regionchange(e) {
                console.log(e.type)
            },
            regionchangestart(e) {
                console.log(e)
            },
            regionchangeend(e) {
                console.log(e)
            },
            markertap(e) {
                console.log(e.mp.markerId)
            },
            controltap(e) {
                console.log(e.controlId)
            },
            poitap(e) {
                console.log(e)
            },
            maptap(e) {
                console.log(e)
            },
            getActivityTimeString(time) {
                const date = new Date(time)
                const day = date.getDay()
                let timeString = ''
                switch (day) {
                    case 1:
                        timeString += '本周一'
                        break
                    case 2:
                        timeString += '本周二'
                        break
                    case 3:
                        timeString += '本周三'
                        break
                    case 4:
                        timeString += '本周四'
                        break
                    case 5:
                        timeString += '本周五'
                        break
                    case 6:
                        timeString += '本周六'
                        break
                    case 7 :
                        timeString += '本周日'
                        break
                }
                const hour = date.getHours()
                const minute = date.getMinutes()
                timeString = timeString + hour + '点' + minute + '分'
                return timeString
            },
            pickerTap() {
                // todo
            },
            bindMultiPickerColumnChange(e) {
                console.log('修改的列为', e.mp.detail.column, '，值为', e.mp.detail.value);
                // todo
            },
            bindMultiPickerChange(e) {
                console.log('picker发送选择改变，携带值为', e.mp.detail.value)
                this.multiIndex = e.mp.detail.value
                const nowDate = new Date()
                const y = nowDate.getFullYear()
                const m = nowDate.getMonth() + 1
                const d = nowDate.getDate()
                const dateString = y + '/' + m + '/' + d + ' ' + this.multiArray[1][this.multiIndex[1]] + ':' + this.multiArray[2][this.multiIndex[2]] + ':00'
                let time1 = new Date(dateString).getTime()
                time1 += this.multiIndex[0] * 24 * 3600 * 1000
                this.activityEdit.date = new Date(time1).getTime()
            },
            postMyLocation() {
                const that = this
                wx.getLocation({
                    type: 'gcj02',
                    success: async function (res) {
                        const latitue = res.latitue
                        const longitude = res.longitude
                        that.latitude = latitue
                        that.longitude = longitude

                        const data = await post('/updateLocation/', {
                            openid: wx.getStorageSync('openid'),
                            location: {latitue: latitue, longitude: longitude}
                        })
                    }
                })
            },
            async getActivityMembersLocation(activity) {
                const openid = wx.getStorageSync('openid')
                if (activity.allMember.indexOf(openid) !== -1) {
                    const allMember = await get('/updateLocation/', {openid: openid, activityId: activityId})
                    for (const item of this.activityPage.activity) {
                        if (item.activityId === activity.activityId) {
                            item.allMember = allMember
                        }
                    }
                }
            }

        }
    }
</script>

<style scoped>@import 'index.vue.css';</style>
