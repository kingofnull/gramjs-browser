const path = require("path");
const webpack = require("webpack");

module.exports =(env, argv) =>( {
  target: ["web"],
  entry: path.resolve(__dirname, "gramjs/index.js"),
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },

      {
        test: /\.js$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      fs: false,
      path: require.resolve("path-browserify"),
      net: false,
      crypto: false,
      os: require.resolve("os-browserify/browser"),
      util: require.resolve("util/"),
      assert: false,
      stream: false,
      constants: false,
    },
  },
mode: argv.mode || "development",
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],

  output: {
    library: "gramjs",
    libraryTarget: "umd",
    auxiliaryComment: "",
    filename: argv.mode=="production" ? "gramjs.min.js" : "gramjs.js",
    path: path.resolve(__dirname, "browser"),
  },
});
