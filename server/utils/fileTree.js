import fs from 'fs/promises'
import path from 'path'

export const generateFileTree = async (directory) => {
    const tree = {}

    const buildTree = async (currDir, currTree) => {
        let files
        try {
            files = await fs.readdir(currDir)
        } catch (err) {
            console.warn(`⚠️ Failed to read directory: ${currDir}`, err.message)
            return
        }

        for (const file of files) {
            if (file === 'node_modules') continue  // ⛔ Skip node_modules

            const filePath = path.join(currDir, file)

            let stat
            try {
                stat = await fs.stat(filePath)
            } catch (err) {
                console.warn(`⚠️ Failed to stat: ${filePath}`, err.message)
                continue
            }

            if (stat.isDirectory()) {
                currTree[file] = {}
                await buildTree(filePath, currTree[file])
            } else {
                currTree[file] = null
            }
        }
    }

    await buildTree(directory, tree)
    return tree
}