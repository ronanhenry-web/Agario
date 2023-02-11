const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

const config = {
	entry: './script.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js'
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: "./indexWebpack.html", to: "index.html" },
			],
		}),
	],
	module: {
		rules: [
			{
				test: /\.js$/,
				use: 'babel-loader',
				exclude: /node_modules/
			},
			{
				test: /\.ts(x)?$/,
				loader: 'ts-loader',
				exclude: /node_modules/
			},
			{
				test: /\.less$/,
				use: [
					'style-loader',
					'css-loader',
					'less-loader'
				]
			}
		]
	},
	resolve: {
		extensions: [
			'.tsx',
			'.ts',
			'.js'
		]
	}
};

module.exports = config;