const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  // Punto de entrada de la aplicación (ES Modules)
  entry: "./src/index.js",

  // Bundle unificado en dist/
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
  },

  module: {
    rules: [
      // Los .css se importan desde JS y se inyectan en el <head>
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },

  resolve: {
    // Ice usa los módulos "net" (TCP) y "fs" (logs) solo cuando corre en Node.
    // En el navegador se conecta por WebSocket, así que no se incluyen.
    fallback: { net: false, fs: false },
  },

  plugins: [
    // Genera dist/index.html e inyecta automáticamente el bundle
    new HtmlWebpackPlugin({ template: "./src/index.html" }),
  ],

  // Servidor de desarrollo (npm start)
  devServer: {
    port: 3000,
    // El overlay solo aparece con errores. La advertencia del código
    // generado por slice2js (uso dinámico de require) es esperada.
    client: { overlay: { warnings: false } },
  },
};
