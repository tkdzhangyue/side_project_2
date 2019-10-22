<template>
    <div @click="clickHandle">

        <map
                id="map"
                style="width: 100%;height: 300px;"
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
</template>

<script>
  import card from '@/components/card'
  import QQMapWx from '../../libs/qqmap-wx-jssdk.js'
  import {mapKey, mapSig} from '../../config/config.js'

  const qqmapsdk = new QQMapWx({key: mapKey})

  export default {
    data() {
      return {
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
        markers: [
          {
            longitude: 121.50983349671823,
            latitude: 38.84391337880264,
            iconPath: '../../static/images/1.png',
            id: 0,
            width: 30,
            height: 30
          }
        ],
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
    created() {
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
    onShow() {
      this.mapCtx = wx.createMapContext('map')
      this.getPolyLine(this.polyline[0].points)
    },
    components: {
      card
    },

    methods: {
      putMark() {
        this.newPolyLine.push({
          latitude: this.centerLocation.latitude,
          longitude: this.centerLocation.longitude
        })
        if (this.newPolyLine.length >= 4) {
          this.getPolyLine(this.newPolyLine)
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
            that.polyline[0].points = pl
          },
          fail: function (err) {
            console.log(err)
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
        console.log(e.markerId)
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
        top: calc(50% - 25px);
        left: calc(50% - 25px);

    }
</style>
