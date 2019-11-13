<template>
  <div>
    <div class="ac-top" v-if="activity.title">
      <div class="author-pic">
        <img class="user-pic" :src="activity.author.avatarUrl">
      </div>
      <div class="act-title_date">
        <div class="act-title">
          {{activity.title}}
        </div>
        <div class="act-date">
          {{activity.localeString}}
        </div>
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
      <div class="take-act" v-if="!isTake">
        <button class="btn-take" size="default" @click="btnTakeOnclick()">
          即刻参加
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
        mounted() {
            this.screenHeight = wx.getSystemInfoSync().windowHeight
        },
        created() {

        },
        onShow() {
            this.activityId = this.$root.$mp.query.id
            doLogin()
            this.getActivityDetail(this.activityId)
        },
        methods: {
            init() {
                this.polyline[0].points = this.activity.polyline.points
                this.initMap()
                this.isTake = this.isAuthor()

                if (this.isTake) {
                    this.postMyLocation()
                }
            },
            isAuthor() {
                // todo
            },
            async getActivityDetail(acId) {
                const data = await get('/activityDetail/', {activityId: acId})
                if (data.success) {
                    this.activity = data.activity.activityInfo
                    this.init()
                    return true
                } else {
                    wx.showToast({title: '网络错误，请稍后重试。', icon: 'none', duration: 900})
                    return false
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
                this.activity.allMember.push(wx.getStorageSync('userInfo'))
            },
            postMyLocation() {
                const that = this
                wx.getLocation({
                    type: 'gcj02',
                    success: async function (res) {
                        const latitude = res.latitude
                        const longitude = res.longitude
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
                    }
                })
            },
            isAuthor() {
                let re = false
                const userInfo = wx.getStorageSync('userInfo')
                if (this.activity.author.openid === userInfo.openid) {
                    re = true
                }
                return re
            }
        },


    }
</script>

<style scoped>@import 'index.vue.css';</style>