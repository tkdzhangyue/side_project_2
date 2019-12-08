<template>
  <div>
    <div class="ac-top" v-if="activity.title">

      <div class="author-pic">
        <image :src="activity.allMember[0].avatarUrl"
               class="user-pic">
        </image>
      </div>

      <div class=" act-title_date
        ">
        <div class="act-title">
          {{activity.title}}
        </div>
        <div class="act-date">
          <label class="date-pre">集合时间:</label>
          {{activity.localeString}}
        </div>
      </div>

      <div class="act-btn">
        <button :style="{borderColor: borderColor}" @click="btnQuiteOnClick()" class="btn-quite"
                size="mini"
                v-if="isTake">
          退出
        </button>
        <!--        <image src='../../static/images/quite.png' mode='widthFix'></image>-->
      </div>
    </div>
    <div :style="{height: screenHeight*0.5 + 'px'}" class="ac-mid">
      <map
        :latitude="mapLa"
        :longitude="mapLo"
        :markers="markers"
        :polyline="polyline"
        :scale="mapScale"
        :subkey="mapKey"
        @end="regionchange"
        @regionchange="regionchange"
        @start="regionchange"
        id="map"
        show-location
        style="width: 100%;height: 100%;">
      </map>
    </div>
    <div :style="{height: 0.5* screenHeight - 48 + 'px'}" class="ac-bom">
      <!--      <label class="mem-title"></label>-->
      <div :style="{paddingLeft:allMemPadding+'px', paddingRight: allMemPadding+'px'}" class="act-allMem"
           v-if="activity.title">
        <div class="act-mem" v-for="(mem,index) in activity.allMember">
          <img :src="mem.avatarUrl">
          <div class="nick">{{mem.nickName}}</div>
        </div>
      </div>
      <div class="take-act">
        <button @click="btnTakeOnclick()" class="btn-take" size="default" v-if="!isTake">
          即刻参加
        </button>

        <button :style="{backgroundColor: importantColor}" class="btn-share" open-type='share' size="default"
                v-if="isTake">
          发送队友
        </button>
      </div>
    </div>
  </div>
</template>

<script>
    import QQMapWx from '../../libs/qqmap-wx-jssdk.js'
    import {mapKey, mapSig, polylineColor, btnColor, importantColor, borderColor} from '../../config/config.js'
    import {deepCopy, doLogin, post, get} from '../../utils/index.js'
    import {Activity} from "../../models/activity";

    export default {
        name: "activityDetail",
        data() {
            return {
                borderColor: borderColor,
                importantColor: importantColor,
                btnColor: btnColor,
                canUpdateLocation: true,
                allMemberLocation: [],
                isTake: false,
                mapScale: 10,
                mapLo: 0,
                mapLa: 0,
                screenHeight: 600,
                screenWidth: 500,
                allMemPadding: 6,
                activityId: '',
                activity: {},
                markers: [],
                polyline: [
                    {
                        points: [],
                        color: polylineColor,
                        width: 6,
                        dottedLine: false
                    }
                ],
                centerLocation: {longitude: 0, latitude: 0},
            }
        },
        onShareAppMessage() {
            const userInfo = wx.getStorageSync('userInfo')
            let title = '我参加了:'
            if (this.activity.allMember[0].openid === userInfo.openid) {
                title = '我发起了:'
            }
            title = title + this.activity.title
            return {
                title: title,
            }
        },
        mounted() {
            this.screenHeight = wx.getSystemInfoSync().windowHeight
            this.screenWidth = wx.getSystemInfoSync().windowWidth
            this.allMemPadding = (this.screenWidth % 50) / 2
        },
        created() {

        },
        onShow() {
            this.activityId = this.$root.$mp.query.id
            doLogin()
            setTimeout(() => {
                this.getActivityDetail(this.activityId)
            }, 10)

            // 初始化时，执行一次获取成员位置信息
            const that = this
            wx.getLocation({
                type: 'gcj02',
                success: async function (res) {
                    that.postMyLocation(res.latitude, res.longitude)
                }
            })

            // 后台获取位置变化信息
            wx.onLocationChange((res) => {
                if (this.canUpdateLocation) {
                    this.postMyLocation(res.latitude, res.longitude)
                    this.canUpdateLocation = false
                    // 4分钟已上传位置信息
                    setTimeout(() => {
                        this.canUpdateLocation = true
                    }, 1000 * 60 * 4)
                }
            })
        },
        methods: {
            init() {
                this.polyline[0].points = this.activity.polyline.points
                this.initMap()
                this.isTake = this.isMember()
            },
            async getActivityDetail(acId) {
                const userInfo = wx.getStorageSync('userInfo')
                const data = await get('/activityDetail/', {activityId: acId, openid: userInfo.openid})
                if (data.success) {
                    this.activity = data.activity.activityInfo
                    setTimeout(() => {
                        for (let i = 0; i++; i < 100) {
                            this.activity.allMember.push(this.activity.allMember[1])
                        }
                    }, 1000)
                    this.initUserPic(this.activity.allMember)
                    this.init()
                    return true
                } else {
                    wx.showToast({title: '网络错误，请稍后重试。', icon: 'none', duration: 900})
                    return false
                }

            },
            initUserPic(allMem) {
                for (const mem in allMem) {
                    if (mem.avatarUrl === '') {
                        mem.avatarUrl = '../../static/images/user_48px.png'
                    }
                }
            },
            initMap() {
                this.mapLa = this.activity.polyline.points[0].latitude * 0.5 + this.activity.polyline.points[this.activity.polyline.points.length - 1].latitude * 0.5
                this.mapLo = this.activity.polyline.points[0].longitude * 0.5 + this.activity.polyline.points[this.activity.polyline.points.length - 1].longitude * 0.5
                // todo
                const x1 = this.activity.polyline.points[0].longitude - this.activity.polyline.points[this.activity.polyline.points.length - 1].longitude
                const y1 = this.activity.polyline.points[0].latitude - this.activity.polyline.points[this.activity.polyline.points.length - 1].latitude
                this.mapScale = 10
                console.log(this.mapLa)
                console.log(this.mapLo)
                console.log(Math.sqrt(x1 * x1 + y1 * y1))
            },
            regionchange(res) {
                console.log(res)
            },
            async btnTakeOnclick() {
                this.isTake = true
                wx.startLocationUpdateBackground({
                    success: (res) => {
                        console.log('startLocationUpdateBackground success')
                    },
                    fail: (err) => {
                        console.log('startLocationUpdateBackground fail')
                    }
                })
                const userInfo = wx.getStorageSync('userInfo')
                const data = {
                    openid: userInfo.openid,
                    userInfo: userInfo,
                    activityId: this.activityId
                }
                const act = await post('/takeActivity/', data)
                this.activity = act.activity.activityInfo
                // this.activity.allMember.push(wx.getStorageSync('userInfo'))
            },
            async postMyLocation(latitude, longitude) {
                const that = this
                // wx.getLocation({
                //     type: 'gcj02',
                // success: async function (res) {
                const data = await post('/updateLocation/', {
                    openid: wx.getStorageSync('openid'),
                    activityId: that.activityId,
                    location: {latitude: latitude, longitude: longitude}
                })
                // 更新活动所有成员的位置信息
                that.markers = []
                for (const mem of data.allLocation) {
                    that.markers.push({
                        latitude: mem.location.latitude,
                        longitude: mem.location.longitude,
                        iconPath: mem.iconPath,
                        id: mem.id,
                        width: 30,
                        height: 30
                    })
                }
                // }
                // })
            },
            isMember() {
                let re = false
                const userInfo = wx.getStorageSync('userInfo')
                for (const mem of this.activity.allMember) {
                    if (mem.openid === userInfo.openid) {
                        re = true
                    }
                }
                return re
            },
            btnQuiteOnClick() {
                const that = this
                wx.showModal({
                    title: "提示",
                    content: "确定要退出活动吗？",
                    success: async function (re) {
                        const userInfo = wx.getStorageSync('userInfo')
                        if (re.confirm) {
                            const res = await post('/quiteActivity/', {
                                activityId: that.activityId,
                                openid: userInfo.openid
                            })
                            // 回到首页
                            wx.navigateBack({})
                        }
                    }
                })
            }
        },


    }
</script>

<style scoped>@import 'index.vue.css';</style>