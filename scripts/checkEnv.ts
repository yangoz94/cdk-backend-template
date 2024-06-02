import * as fs from "fs";
import * as path from "path";

// Path to .env and .env.example
const envPath = path.join(__dirname, "..", ".env");
const envExamplePath = path.join(__dirname, "..", ".env.example");

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.error(
    "Error: .env file not found. Please create a .env file in the project root and make sure you define all the varaibles in .env.example"
  );
  process.exit(1);
}

// Read .env and .env.example files
const env = fs.readFileSync(envPath, "utf-8");
const envExample = fs.readFileSync(envExamplePath, "utf-8");

// Split into lines
const envLines = env.split("\n");
const envExampleLines = envExample.split("\n");

// Check each variable in .env.example exists in .env
envExampleLines.forEach((line: string) => {
  const [key] = line.split("=");
  if (!envLines.find((envLine: string) => envLine.startsWith(key))) {
    console.error(
      `Error: ${key} not found in .env. Please add it to your .env file.`
    );
    process.exit(1);
  }
});

console.log(".env check passed.");
