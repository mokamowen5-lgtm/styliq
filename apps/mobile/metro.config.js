const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

// Watch the entire monorepo so changes in @stylesnap/types propagate
config.watchFolders = [workspaceRoot]

// Resolve modules from the workspace's hoisted node_modules first, then local
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]
config.resolver.disableHierarchicalLookup = true

module.exports = withNativeWind(config, { input: "./global.css" })
