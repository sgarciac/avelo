<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Bike } from 'lucide-vue-next'
import HomeMenu from './components/HomeMenu.vue'
</script>
<template>
  <header class="text-center mb-md pb-md background">
    <RouterLink to="/" class="prose">
      <div
        class="inline-block border-4 border-light rounded-xl text-center min-w-xxl min-h-xxl align-top mt-sm-md"
      >
        <Bike class="inline align-text-top pb-1" color="white" :size="32" :stroke-width="2.5" />
      </div>
      <h1 class="ml-sm mt-sm-md inline-block text-light">Àvélytique</h1>
    </RouterLink>
  </header>

  <div class="w-full flex flex-col items-center">
    <HomeMenu class="left" />
  </div>
  <RouterView />

  <footer class="w-full flex flex-col items-center py-md bg-marker">
    <div class="w-full flex flex-row justify-around">
      <!--HelloWorld msg="You did it!" /-->
      <nav class="tablist">
        <RouterLink class="tab link" to="/">Page d'accueil</RouterLink>
        <RouterLink class="tab link" to="/about">À propos</RouterLink>
        <RouterLink class="tab link" to="/data">Données</RouterLink>
      </nav>
    </div>
  </footer>
</template>
