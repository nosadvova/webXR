// vite.config.js
import basicSsl from "@vitejs/plugin-basic-ssl"

export default {
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        task1: "task1.html",
        task2: "task2.html",
        task3: "task3.html",
        task4: "task4.html",
      },
    },
  },
  plugins: [
    basicSsl({
      /** name of certification */
      name: "test",
      /** custom trust domains */
      domains: ["*.custom.com"],
    }),
  ],
}
