<template>
  <div class="log-main">
    <!--    <div class="top-tap">-->
    <!--      <div class="tap-month" v-for="(mon,index) in myAct">-->
    <!--        <div class="tap-content"></div>-->

    <!--      </div>-->
    <!--    </div>-->

    <div class="my-act" v-for="(act,index) in myAct" v-if="myAct.length>0" @click="actOnClick(act.activityId)">
      <div class="act-title">
        <div class="act-t">{{act.title}}</div>
        <div class="act-date">{{act.localeString}}</div>
      </div>
      <div class="act-mems">
        <div class="act-mem" v-for="(mem, memIndex) in act.allMember">
          <img :src="mem.avatarUrl">
          <div class="mem-nick">{{mem.nickName}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
    import {deepCopy, doLogin, post, get, isNull} from '../../utils/index.js'
    import {Activity} from "../../models/activity";

    export default {
        components: {},
        data() {
            return {
                myAct: [],
                openid: '',
            }
        },
        onShow() {
            this.init()
            this.getMyAct(this.openid)
        },
        created() {
        },
        mounted() {
        },
        methods: {
            init() {
                this.openid = wx.getStorageSync('openid')
                if (isNull(this.openid) || this.openid.length < 25) {
                    this.openid = doLogin()
                }
            },
            async getMyAct(openid) {
                if (!isNull(openid) && openid.length > 25) {
                    const data = await get('/myActivity', {openid: openid})
                    this.myAct = data.activity
                }
            },
            actOnClick(activityId) {
                const openid = wx.getStorageSync('openid')
                if (openid === '') {
                    return
                }
                wx.navigateTo({
                    url: '/pages/activityDetail/main?id=' + activityId
                })
            }
        }
    }
</script>

<style>@import 'index.vue.css';</style>
