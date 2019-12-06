<template>
  <div class="log-main">
    <div class="my-act" v-for="(act,index) in myAct" @click="actOnClick(act.activityId)">
      <div class="act-title">
        <div class="act-t">{{act.title}}</div>
        <div class="act-date">{{act.localeString}}</div>
      </div>
      <div class="act-mems">
        <div class="act-mem" v-for="(mem, memIndex) in act.allMember">
          <image :src="mem.avatarUrl"></image>
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
                myAct: [{
                    title: '',
                    localeString: '',
                    activityId: '',
                    allMember: []
                }],
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
                    const data = await get('/myActivity/', {openid: openid})
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
