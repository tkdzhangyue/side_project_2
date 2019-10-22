<template>
    <div class="pMain" :style="{height: screenHeight+'px'}">

        <open-data type="userAvatarUrl" class="user-pic-head"></open-data>
        <div class="map-menu" :style="{top: screenHeight*0.4-30+'px'}" v-if="beginMakeActivity">
            <button class="btn-new-activity" type="default" size="mini" :loading="false" :plain="false"
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
                <!--                <cover-view class="cover-avatar">-->
                <!--                    &lt;!&ndash;                    <open-data type="userAvatarUrl" class="user-pic"></open-data>&ndash;&gt;-->
                <!--                    &lt;!&ndash;                    <cover-image src&ndash;&gt;-->
                <!--                </cover-view>-->
            </map>
        </div>
        <div class="activity">
            <swiper class="activity-swipper" :indicator-dots="true" v-if="!publishNewActivity">
                <div class="all-activity" v-for="(page,pageIndex) in activityPage">
                    <swiper-item>
                        <div class="swiper-div">
                            <button v-if="!canIUse && pageIndex===1" open-type="getUserInfo"
                                    @getuserinfo="bindGetUserInfo">授权登录
                            </button>

                            <div class="page-title">
                                <label>{{page.title}}</label>
                            </div>

                            <div class="each-activity">
                                <div class="one-activity" @click="activityOnClick(pageIndex, activityIndex)"
                                     v-for="(oneActivity, activityIndex) in page.activity">
                                    <img class="user-pic" :src="oneActivity.author.avatarUrl">
                                    <label class="user-nic">{{oneActivity.author.nickName}}</label>
                                    <!--                                    <open-data type="userAvatarUrl" class="user-pic"></open-data>-->
                                    <!--                                    <open-data type="userNickName" lang="zh_CN" class="user-nic"></open-data>-->
                                    <div class="activity-detail">
                                        <div class="activity_title-date">
                                            <div>{{oneActivity.title}}</div>
                                            <div> {{oneActivity.date}}</div>
                                        </div>
                                        <div class="activity-intensity">
                                            {{oneActivity.intensity}}
                                        </div>
                                        <div class="activity-button">
                                            <button size="mini" @click="takeActivity(activityIndex)">参加</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </swiper-item>
                </div>
            </swiper>
            <div class="edit-activity" v-if="publishNewActivity">
                <input placeholder="活动介绍" v-bind="activityEdit.title">
                <input placeholder="活动时间" v-bind="activityEdit.date">
                <input placeholder="活动强度介绍" v-bind="activityEdit.intensity">
                <button class="btn-publish" size="default" @click="publishActivity()">确认发布</button>
                <button class="btn-cancel" size="default" @click="cancelPublish()">取消</button>
            </div>
        </div>
    </div>
</template>

<script>
  import QQMapWx from '../../libs/qqmap-wx-jssdk.js'
  import {mapKey, mapSig} from '../../config/config.js'
  import {deepCopy, doLogin} from '../../utils/index.js'

  const qqmapsdk = new QQMapWx({key: mapKey})

  export default {
    data() {
      return {
        activityEdit: {title: '', date: '', intensity: ''},
        publishNewActivity: false,
        beginMakeActivity: false,
        userInfo: {},
        canIUse: false,
        activityPage: [
          {
            title: '人气Top',
            activity: [
              {
                title: '活动测试1',
                date: '19号上午8点',
                intensity: '新人谨慎参加',
                author: {
                  nickName: 'test',
                  avatarUrl: 'https://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83epFyCELpVg2fGviaoicEQBNvcEMj6FoVzpJsoJ6ciafoF7JzaSqZHIyFV3fAg9IZaHacFkJXESRSmE7g/132'
                },
                points: [
                  {
                    longitude: 121.50983349671823,
                    latitude: 38.84391337880264
                  },
                  {
                    longitude: 121.40749526614617,
                    latitude: 38.83383399871607
                  }
                ]
              },
              {
                title: '活动测试2',
                date: '22号上午8点',
                intensity: '新人谨慎参加',
                author: {
                  nickName: 'test',
                  avatarUrl: 'https://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83epFyCELpVg2fGviaoicEQBNvcEMj6FoVzpJsoJ6ciafoF7JzaSqZHIyFV3fAg9IZaHacFkJXESRSmE7g/132'
                },
                points: [
                  {
                    longitude: 121.3691957226978,
                    latitude: 38.85129264853112
                  },
                  {
                    longitude: 121.20543077170386,
                    latitude: 38.86617480780238
                  }
                ]
              }
            ]
          },
          {
            title: '我发起的活动',
            activity: []
          }
        ],
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
            points: [

              {
                longitude: 121.50983349671823,
                latitude: 38.84391337880264
              },
              {
                longitude: 121.40749526614617,
                latitude: 38.83383399871607
              }
            ],
            color: '#FF0000DD',
            width: 6,
            dottedLine: false
          }
        ]

      }
    },
    mounted() {
      this.screenHeight = wx.getSystemInfoSync().windowHeight
      this.polyline[0].points = this.activityPage[0].activity[0].points
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
      this.getPolyLine(this.polyline[0].points)
    },
    components: {},
    methods: {
      cancelPublish() {
        this.publishNewActivity = false
        this.polyline = []
        this.markers = []
      },
      publishActivity() {
        // todo
      },
      takeActivity(activityIndex) {
        // todo
      },
      startNewActivity() {
        this.getPolyLine(deepCopy(this.markers))
        this.beginMakeActivity = false
        this.publishNewActivity = true
      },
      bindGetUserInfo(res) {
        console.log(res)
        // success
        if (res.mp.detail.errMsg.indexOf('ok') >= 0) {
          wx.setStorageSync('userInfo', res.mp.detail.userInfo)
        }
      },
      activityOnClick(pageIndex, activityIndex) {
        wx.showLoading({
          title: '加载中' // 数据请求前loading
        })
        this.getPolyLine(deepCopy(this.activityPage[pageIndex].activity[activityIndex].points))
      },
      putMark() {
        this.newPolyLine.push({
          latitude: this.centerLocation.latitude,
          longitude: this.centerLocation.longitude
        })
        if (this.newPolyLine.length >= 4) {
          this.getPolyLine(this.newPolyLine)
        }

        this.markers.push({
          latitude: this.centerLocation.latitude,
          longitude: this.centerLocation.longitude,
          iconPath: '../../static/images/3.png',
          id: this.markers.length === 0 ? 1 : this.markers[this.markers.length - 1].id + 1,
          width: 30,
          height: 30
        })

        if (this.markers.length >= 2) {
          this.beginMakeActivity = true
        }
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
        const that = this
        let latitude = 0
        let longitude = 0
        this.mapCtx.getCenterLocation({
          success: function (res) {
            latitude = res.latitude
            longitude = res.longitude
            that.centerLocation.latitude = latitude
            that.centerLocation.longitude = longitude
          },
          fail: function (onRejected) {
            console.log(onRejected)
          }
        })
        // this.mapCtx.includePoints({
        //   padding: [10],
        //   points:[{
        //     latitude:latitude,
        //     longitude: longitude
        //   }]
        // })
        // this.mapCtx.translateMarker({
        //   markerId: 0,
        //   autoRotate: true,
        //   duration: 1000,
        //   destination: {
        //     latitude:latitude,
        //     longitude:longitude,
        //   },
        //   animationEnd() {
        //     console.log('animation end')
        //   }
        // })
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
      }

    }
  }
</script>

<style scoped>
    .cover-view {
        position: absolute;
        top: calc(50% - 50px);
        left: calc(50% - 25px);
    }

    .cover-avatar {
        position: absolute;
        top: 0;
        right: 0;
        width: 60px;
        height: 60px;
    }

    .pMain {
        overflow: hidden;
    }

    .map-border {
        height: 40%;
    }

    .activity {
        height: 59%;
        margin-top: 10px;
    }

    .activity-swipper {
        height: 100%;
    }

    .swiper-div {
        /*overflow-y: auto;*/
    }

    .page-title {
        height: 40px;
        width: 100%;
        text-align: center;
        line-height: 40px;
    }

    .each-activity {
        height: 100%;
        overflow-y: auto;
    }

    .one-activity {
        height: 48px;
        width: 100%;
        display: flex;
        flex-direction: row;
    }

    .user-pic {
        height: 45px;
        width: 45px;
        min-height: 45px;
        min-width: 45px;
    }

    .user-nic {
        width: 90px;
        height: 100%;
    }

    .activity_title-date {
        height: 100%;
        width: 40%;
    }

    .activity_title-date div {
        width: 100%;
        height: 44%;
    }

    .activity-intensity {
        height: 100%;
        width: 30%;
    }

    .activity-button {
        height: 100%;
        width: 30%;
    }

    .activity-detail {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: row;
    }

    .user-pic-head {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 1000;
        height: 40px;
        width: 40px;
    }

    .map-menu {
        position: absolute;
        right: 0;
        z-index: 1000;
        height: 40px;
        width: 80px;
    }

    .activity-button {
        text-align: center;
    }

    .activity-button button {
        margin: 0 auto;
    }

    .edit-activity {
        width: 100%;
        height: 100%;
    }

    .edit-activity input {
        border-bottom: 1px solid;
    }
</style>
