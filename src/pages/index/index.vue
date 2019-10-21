<template>
    <div @click="clickHandle">

        <map
                id="map"
                style="width: 100%;height: 300px;"
                longitude="121.50983349671823" latitue="38.84391337880264"
                scale="6"
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
        </map>
    </div>
</template>

<script>
  import card from '@/components/card'
  import QQMapWx from '../../libs/qqmap-wx-jssdk.js'
  import {mapKey, mapSig} from '../../config/config.js'

  const qqmapsdk = new QQMapWx({key: mapKey})

  export default {
    data () {
      return {
        motto: 'Hello miniprograme',
        userInfo: {
          nickName: 'mpvue',
          avatarUrl: 'http://mpvue.com/assets/logo.png'
        },
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
    created () {
      this.mapCtx = wx.createMapContext('map')
    },
    onShow () {
      this.getPolyLine()
    },
    components: {
      card
    },

    methods: {
      getPolyLine () {
        const that = this
        qqmapsdk.direction({
          sig: mapSig,
          mode: 'driving',
          policy: 'AVOID_HIGHWAY',
          from: {latitude: 38.84391337880264, longitude: 121.50983349671823},
          to: {latitude: 38.83383399871607, longitude: 121.40749526614617},
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
      regionchange (e) {
        console.log(e.type)
      },
      regionchangestart (e) {
        console.log(e)
      },
      regionchangeend (e) {
        console.log(e)
        this.mapCtx.getCenterLocation({
          success: function (res) {
            console.log(res.longitude)
            console.log(res.latitude)
            this.markers[0] = {
              longitude: res.longitude,
              latitude: res.latitude,
              iconPath: '@/../static/images/1.png',
              id: 0,
              width: 30,
              height: 30
            }
          },
          fail: function (onRejected) {
            console.log(onRejected)
          }
        })
      },
      markertap (e) {
        console.log(e.markerId)
      },
      controltap (e) {
        console.log(e.controlId)
      },
      poitap (e) {
        console.log(e)
      },
      maptap (e) {
        console.log(e)
      }

    }
  }
</script>

<style scoped>

</style>
