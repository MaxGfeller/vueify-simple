const Vue = require('vue/dist/vue.common.js')
const TestComponent = require('./TestComponent.vue')

const app = new Vue({
  el: '#container',
  components: {
    'app': TestComponent
  },
  template: '<app></app>'
})
