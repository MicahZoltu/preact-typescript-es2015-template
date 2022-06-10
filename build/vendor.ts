import * as path from 'path'
import { promises as fs } from 'fs'
import { recursiveDirectoryCopy } from '@zoltu/file-copier'

const dependencyPaths = [
	{ packageName: 'es-module-shims', subfolderToVendor: 'dist', entrypointFile: 'es-module-shims.js' },
	{ packageName: 'preact', subfolderToVendor: 'dist', entrypointFile: 'preact.module.js' },
	{ packageName: 'preact/jsx-runtime', subfolderToVendor: 'dist', entrypointFile: 'jsxRuntime.module.js' },
]

async function vendorDependencies() {
	for (const { packageName, subfolderToVendor } of dependencyPaths) {
		const sourceDirectoryPath = path.join(__dirname, '..', 'node_modules', packageName, subfolderToVendor)
		const destinationDirectoryPath = path.join(__dirname, '..', 'app', 'vendor', packageName)
		await recursiveDirectoryCopy(sourceDirectoryPath, destinationDirectoryPath, undefined, fixSourceMap.bind(undefined, sourceDirectoryPath))
	}

	const indexHtmlPath = path.join(__dirname, '..', 'app', 'index.html')
	const oldIndexHtml = await fs.readFile(indexHtmlPath, 'utf8')
	const importmap = dependencyPaths.reduce((importmap, { packageName, entrypointFile }) => {
		importmap.imports[packageName] = `./${path.join('.', 'vendor', packageName, entrypointFile).replace(/\\/g, '/')}`
		return importmap
	}, { imports: {} as Record<string, string> })
	const importmapJson = JSON.stringify(importmap, undefined, '\t')
		.replace(/^/mg, '\t\t')
	const newIndexHtml = oldIndexHtml.replace(/<script type='importmap'>[\s\S]*?<\/script>/m, `<script type='importmap'>\n${importmapJson}\n\t</script>`)
	await fs.writeFile(indexHtmlPath, newIndexHtml)
}

// fix any source maps that refer to sources that are outside of the copied directory by putting the virtual file pointer in a __source__ folder inside the copied directory
async function fixSourceMap(sourceRootPath: string, sourcePath: string, destinationPath: string) {
	const fileExtension = path.extname(sourcePath)
	if (fileExtension !== '.map') return
	const fileContents = JSON.parse(await fs.readFile(sourcePath, 'utf-8')) as { sources: Array<string> }
	for (let i = 0; i < fileContents.sources.length; ++i) {
		const absolutePathOfSource = path.join(path.dirname(sourcePath), fileContents.sources[i])
		const relativePathFromRootToSource = path.relative(sourceRootPath, absolutePathOfSource)
		// source file is properly contained within the source root
		if (!relativePathFromRootToSource.startsWith('..')) continue
		const segments = relativePathFromRootToSource.split(path.sep)
		const segmentsWithoutParents = segments.filter(segment => segment !== '..')
		const newPath = ['.', '__source__', ...segmentsWithoutParents].join('/')
		fileContents.sources[i] = newPath
	}
	await fs.writeFile(destinationPath, JSON.stringify(fileContents))
}

if (require.main === module) {
	vendorDependencies().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
