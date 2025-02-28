const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = (nodeEnv === 'production');

module.exports = {
	mode: nodeEnv,
	optimization: {
		minimize: isProd,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress:{
						drop_console: true,
					}
				}
			}),
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: 'h5p-piano-performance.css'
		}),
		new HtmlWebpackPlugin({
			template: './src/demo/index.html',
			filename: 'demo/index.html',
		})
	],
	entry: {
		demo: './src/demo/demo.js',
		h5p: './src/h5p-wrapper.js',
	},
	output: {
		filename: ({chunk: {name}}) => {
			if (name === 'h5p') {
				return 'h5p-piano-performance.js';
			}
			if (name === 'demo') {
				return 'demo/demo.js';
			}
		},
		path: path.resolve(__dirname, 'dist')
	},
	target: ['web', 'es5'], // IE11
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader'
			},
			{
				test: /\.(s[ac]ss|css)$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							publicPath: ''
						}
					},
					{ loader: "css-loader" },
					{ loader: "sass-loader" }
				]
			},
			{
				test: /\.svg|\.jpg|\.png$/,
				include: path.join(__dirname, 'src/images'),
				type: 'asset/resource',
			},
			{
				test: /\.woff$/,
				include: path.join(__dirname, 'src/fonts'),
				type: 'asset/resource'
			}
		]
	},
	stats: {
		colors: true
	},
	devtool: (isProd) ? undefined : 'eval-cheap-module-source-map'
};
