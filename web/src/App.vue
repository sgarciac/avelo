<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="w-full flex flex-col items-center">
    <div class="w-fulls">
      <!--HelloWorld msg="You did it!" /-->
      <nav class="tablist">
        <RouterLink class="tab" to="/">Page d'accueil</RouterLink>&nbsp;
        <RouterLink class="tab" to="/about">à propos</RouterLink>
      </nav>
    </div>

    <div>
      <RouterView />
    </div>
  </div>
</template>

<style scoped></style>
