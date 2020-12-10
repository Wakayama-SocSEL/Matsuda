import * as glob from 'glob'
import * as fs from 'fs/promises'

type PackageJSON = {
  dependencies: {[key: string]: string}
}

(async () => {
 const promises = glob
   .sync("./out/package.*.json")
   .map<Promise<PackageJSON>>(async (filepath) => {
     try {
       return JSON.parse(await fs.readFile(filepath, 'utf-8'))
     } catch (e) {
       return null
     }
   });
  const jsons = (await Promise.all(promises)).filter((json) => {
    return json !== null &&
      json.dependencies &&
      Object.keys(json.dependencies).length > 0
  })
})()
