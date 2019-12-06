<template>
  <div>
    <div class="ac-top" v-if="activity.title">

      <div class="author-pic">
        <image class="user-pic"
               :src="activity.allMember[0].avatarUrl">
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
        <button v-if="isTake" class="btn-quite" size="mini"
                @click="btnQuiteOnClick()">
          <image src='../../static/images/quite.png' mode='widthFix'></image>
        </button>
      </div>
    </div>
    <div class="ac-mid" :style="{height: screenHeight*0.5 + 'px'}">
      <map
          id="map"
          style="width: 100%;height: 100%;"
          :longitude="mapLo"
          @regionchange="regionchange"
          @start="regionchange"
          @end="regionchange"
          :latitude="mapLa"
          :scale="mapScale"
          :markers="markers"
          :polyline="polyline"
          :subkey="mapKey"
          show-location>
      </map>
    </div>
    <div class="ac-bom" :style="{height: 0.5* screenHeight - 48 + 'px'}">
      <!--      <label class="mem-title"></label>-->
      <div class="act-allMem" v-if="activity.title">
        <div class="act-mem" v-for="(mem,index) in activity.allMember">
          <img :src="mem.avatarUrl">
          <div class="nick">{{mem.nickName}}</div>
        </div>
      </div>
      <div class="take-act">
        <button v-if="!isTake" class="btn-take" size="default" @click="btnTakeOnclick()">
          即刻参加
        </button>

        <button v-if="isTake" class="btn-share" open-type='share' size="default">
          分享我的训练
        </button>
      </div>
    </div>
  </div>
</template>

<script>
    import QQMapWx from '../../libs/qqmap-wx-jssdk.js'
    import {mapKey, mapSig, polylineColor} from '../../config/config.js'
    import {deepCopy, doLogin, post, get} from '../../utils/index.js'
    import {Activity} from "../../models/activity";

    export default {
        name: "index",
        data() {
            return {
                canUpdateLocation: true,
                allMemberLocation: [],
                isTake: false,
                mapScale: 10,
                mapLo: 0,
                mapLa: 0,
                screenHeight: 600,
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
            let title = '我参加了一次高性能单车训练'
            if (this.activity.allMember[0].openid === userInfo.openid) {
                title = '我发起了一次高性能单车训练'
            }
            return {
                title: title,
            }
        },
        mounted() {
            this.screenHeight = wx.getSystemInfoSync().windowHeight
        },
        created() {

        },
        onShow() {
            this.activityId = this.$root.$mp.query.id
            doLogin()
            this.getActivityDetail(this.activityId)

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
                this.isTake = this.isAuthor()
            },
            async getActivityDetail(acId) {
                const userInfo = wx.getStorageSync('userInfo')
                const data = await get('/activityDetail/', {activityId: acId, openid: userInfo.openid})
                if (data.success) {
                    this.activity = data.activity.activityInfo
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
            isAuthor() {
                let re = false
                const userInfo = wx.getStorageSync('userInfo')
                if (this.activity.allMember[0].openid === userInfo.openid) {
                    re = true
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