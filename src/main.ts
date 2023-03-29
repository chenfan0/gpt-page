import { createApp } from "vue";
import App from "./App.vue";
import Markdown from 'vue3-markdown-it';
import "normalize.css";

const app = createApp(App);
app.use(Markdown);
app.mount("#app");
