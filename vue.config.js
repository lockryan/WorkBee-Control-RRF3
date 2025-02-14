const CustomImportsPlugin = require('./webpack/lib/custom-imports-plugin.js')
const CompressionPlugin = require('compression-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')

module.exports = {
	configureWebpack: {
		externals: {
			moment: 'moment'
		},
		optimization: {
			chunkIds: 'named',
			concatenateModules: false,
			flagIncludedChunks: false,
			mergeDuplicateChunks: false,
			moduleIds: 'named',
			occurrenceOrder: false,
			removeAvailableModules: false,
			usedExports: false
		},
		performance: { hints: false },
		plugins: (process.env.NODE_ENV === 'production') ? [
			new CustomImportsPlugin(),
			new CompressionPlugin({
				minRatio: Infinity
			}),
			new ZipPlugin({
				filename: 'WorkBeeControl-SD.zip',
				include: [/\.gz$/, /\.woff$/, /\.woff2$/],
				exclude: [/DummyPlugin/, 'robots.txt']
			}),
			new ZipPlugin({
				filename: 'WorkBeeControl-SBC.zip',
				exclude: [/\.gz$/, /\.zip$/, /DummyPlugin/]
			})
		] : []
	},
	chainWebpack: config => {
		config.optimization.minimizer('terser').tap(args => {
			const { terserOptions } = args[0]
			terserOptions.keep_classnames = true;
			terserOptions.keep_fnames = true;
			return args
		});
		config.optimization.set('splitChunks', {
			chunks: 'all',
			cacheGroups: {
				default: false,
				vendors: false
			}
		});
		config.plugins.delete('prefetch');
		config.plugins.delete('hash-module-ids');
	},
	pwa: {
		name: 'Duet Web Control',
		themeColor: '#ff751a',
		appleMobileWebAppCapable: 'yes',
		appleMobileWebAppStatusBarStyle: 'black'
	},
	transpileDependencies: [
		'vuetify'
	]
}
