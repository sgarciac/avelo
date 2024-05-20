<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="wrapper">
    <!--HelloWorld msg="You did it!" /-->

    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
    </nav>
  </div>

  <div class="main-container">
    <RouterView />
  </div>
</template>

<style scoped>
.main-container {
  width: 1020px;
}
</style>
