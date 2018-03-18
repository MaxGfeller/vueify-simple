<template>
  <div>{{counter}}</div>
</template>
<script>

// es-2015 style exports (not supported by browserify natively)
export default {
  data () {
    return {
      counter: 0
    }
  },
  created () {
    setInterval(() => {
      this.counter++
    }, 1000)
  }
}

</script>
