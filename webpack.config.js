var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    context: __dirname,
    entry: __dirname + "/src/js/skeletabs.js",
    output: {
        path: __dirname + "/dist",
        filename: "skeletabs.js"
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: "style!css"
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [{
                        loader: "css-loader"
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            outputStyle: "expanded",
                            indentWidth: 4
                        }
                    }]
                })
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin("skeletabs.css"),
        new webpack.optimize.UglifyJsPlugin()
    ]
};