import Vue from 'vue/dist/vue.common.js'
import TestComponent from './Component.vue'

const app = new Vue({
  el: '#container',
  components: {
    'app': TestComponent
  },
  template: '<app></app>'
})
