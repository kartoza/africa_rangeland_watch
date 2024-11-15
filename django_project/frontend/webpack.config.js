const path = require("path");
const BundleTracker = require('webpack-bundle-tracker');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const webpack = require("webpack");

const mode = process.env.npm_lifecycle_script;
const isDev = mode.includes('dev');
const isServe = mode.includes('serve');
const filename = isDev ? "[name]" : "[name].[fullhash]";
const statsFilename = isDev ? './webpack-stats.dev.json' : './webpack-stats.prod.json';

const output = {
    path: path.resolve(__dirname, "./bundles/frontend"),
    filename: `${filename}.js`,
    publicPath: isServe && isDev ? 'http://localhost:9000/static/' : undefined,
};

const config = {
    mode: isDev ? 'development' : 'production',
    entry: {
        App: './src/index.tsx',
    },
    output,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            {
                test: /\.s[ac]ss$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
        ],
    },
    resolve: {
        modules: ['node_modules'],
        extensions: [".ts", ".tsx", ".js", ".css", ".scss"],
        fallback: { fs: false },
    },
    optimization: {
        minimize: !isDev,
        splitChunks: {
            cacheGroups: {
                styles: {
                    name: "styles",
                    type: "css/mini-extract",
                    chunks: "all",
                    enforce: true,
                },
            },
        },
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
        }),
        new CleanWebpackPlugin(),
        new BundleTracker({ filename: statsFilename }),
        new MiniCssExtractPlugin({
            filename: `${filename}.css`,
            chunkFilename: `${filename}.css`,
            ignoreOrder: true,
        }),
        ...(isServe && isDev ? [new ReactRefreshWebpackPlugin()] : []),
    ],
    watchOptions: {
        ignored: ['node_modules', './**/*.py'],
        aggregateTimeout: 300,
        poll: 1000,
    },
    devtool: isDev ? 'inline-source-map' : false,
    devServer: isServe ? {
        hot: true,
        port: 9000,
        headers: { 'Access-Control-Allow-Origin': '*' },
        devMiddleware: { writeToDisk: true },
        allowedHosts: 'all',
        compress: true,
    } : undefined,
};

module.exports = config;
