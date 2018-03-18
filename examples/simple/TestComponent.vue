<template>
  <div>
    <heading />
    <span class="title">Hello there!</span>
  </div>
</template>

<script>
  const Title = require('./Title.vue')

  module.exports = {
    created: function () {
      console.log('component got created')
    },
    components: {
      heading: Title
    }
  }
</script>
