import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import interceptor from './interceptor'


const app = createApp(App);
app.config.globalProperties.$apiInstance = interceptor;



app.mount('#app')
