// vite.config.js
import mkcert from "vite-plugin-mkcert";

export default {
  server: {
    https: true,
  },
  plugins: [mkcert()],
};
