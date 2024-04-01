import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as process from "process";

function renameFiles(currentName: string, newName: string) {
  const binPath = path.join("bin", `${currentName}.ts`);
  const newPath = path.join("bin", `${newName}.ts`);

  try {
    fs.renameSync(binPath, newPath);
    console.log(`Successfully renamed ${binPath} to ${newPath}`);
  } catch (err) {
    console.error(`Error renaming ${binPath} to ${newPath}: ${err}`);
  }

  try {
    let content = fs.readFileSync(newPath, { encoding: "utf-8" });
    content = content.replace(new RegExp(currentName, "g"), newName);
    fs.writeFileSync(newPath, content);
    console.log(`Successfully updated ${newPath} with the new name`);
  } catch (err) {
    console.error(`Error updating ${newPath} with the new name: ${err}`);
  }

  const testPath = path.join("test", `${currentName}.test.ts`);
  const newTestPath = path.join("test", `${newName}.test.ts`);

  try {
    fs.renameSync(testPath, newTestPath);
    console.log(`Successfully renamed ${testPath} to ${newTestPath}`);
  } catch (err) {
    console.error(`Error renaming ${testPath} to ${newTestPath}: ${err}`);
  }

  try {
    let testContent = fs.readFileSync(newTestPath, { encoding: "utf-8" });
    testContent = testContent.replace(new RegExp(currentName, "g"), newName);
    fs.writeFileSync(newTestPath, testContent);
    console.log(`Successfully updated ${newTestPath} with the new name`);
  } catch (err) {
    console.error(`Error updating ${newTestPath} with the new name: ${err}`);
  }
}

function updateCdkJson(newName: string, oldName: string) {
  const cdkJsonPath = "cdk.json";

  if (fs.existsSync(cdkJsonPath)) {
    try {
      let cdkJson = JSON.parse(
        fs.readFileSync(cdkJsonPath, { encoding: "utf-8" })
      );
      const appField = cdkJson.app;
      if (appField) {
        cdkJson.app = appField.replace(
          `bin/${oldName}.ts`,
          `bin/${newName}.ts`
        );
        fs.writeFileSync(cdkJsonPath, JSON.stringify(cdkJson, null, 2));
        console.log(`Successfully updated ${cdkJsonPath} with the new name`);
      } else {
        console.log(`No "app" field found in ${cdkJsonPath}`);
      }
    } catch (err) {
      console.error(`Error updating ${cdkJsonPath} with the new name: ${err}`);
    }
  } else {
    console.log(`${cdkJsonPath} does not exist`);
  }
}

function updatePackageJson(newName: string, oldName: string) {
  const packageJsonPath = "package.json";
  const packageLockPath = "package-lock.json";

  try {
    let packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, { encoding: "utf-8" })
    );
    packageJson.name = newName;
    if (packageJson.bin) {
      const binKeys = Object.keys(packageJson.bin);
      binKeys.forEach((key) => {
        if (key === oldName) {
          delete packageJson.bin[key];
        }
      });
      packageJson.bin[newName] = `bin/${newName}.ts`;
    }
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Successfully updated ${packageJsonPath} with the new name`);
  } catch (err) {
    console.error(
      `Error updating ${packageJsonPath} with the new name: ${err}`
    );
  }

  if (fs.existsSync(packageLockPath)) {
    try {
      let packageLockJson = JSON.parse(
        fs.readFileSync(packageLockPath, { encoding: "utf-8" })
      );
      // Update root name field
      packageLockJson.name = newName;

      // Update nested package name and bin fields if they exist
      if (packageLockJson.packages && packageLockJson.packages[""].bin) {
        packageLockJson.packages[""].name = newName;
        const binKeys = Object.keys(packageLockJson.packages[""].bin);
        binKeys.forEach((key) => {
          if (key === oldName) {
            delete packageLockJson.packages[""].bin[key];
          }
        });
        packageLockJson.packages[""].bin[newName] = `bin/${newName}.ts`;
      }

      fs.writeFileSync(
        packageLockPath,
        JSON.stringify(packageLockJson, null, 2)
      );
      console.log(`Successfully updated ${packageLockPath} with the new name`);
    } catch (err) {
      console.error(
      );
    }
  } else {
    console.log(`${packageLockPath} does not exist`);
  }

  // Call the updateCdkJson function
  updateCdkJson(newName, oldName);
}

function validateNewName(newName: string): boolean {
  return /^[0-9a-zA-Z_-]+$/.test(newName);
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const newName: string = await new Promise((resolve) => {
    rl.question("Enter the new name: ", resolve);
  });
  rl.close();

  if (!validateNewName(newName)) {
    console.error(
      "Invalid name. Only alphanumeric characters, hyphens and underscores are allowed."
    );
    process.exit(1);
  }

  const binFiles = fs.readdirSync("bin").filter((file) => file.endsWith(".ts"));

  if (binFiles.length === 0) {
    console.error("No TypeScript files found in the bin directory.");
    process.exit(1);
  }

  const currentAppName = binFiles[0].replace(".ts", "");
  renameFiles(currentAppName, newName);
  updatePackageJson(newName, currentAppName);

  console.log(`Renamed ${currentAppName} to ${newName}`);
}

main();
