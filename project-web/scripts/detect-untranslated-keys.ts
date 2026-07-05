#!/usr/bin/env node

import fs from "fs";
import path from "path";
import ts from "typescript";

// =====================
// CONFIGURATION
// =====================
const SUPPORTED_LANGUAGES = ["ar", "en", "fr"];
const SCAN_DIRECTORIES = ["src", "components", "admin", "web"];
const LOCALES_DIR = path.join(process.cwd(), "public", "locales");

// =====================
// UTILITIES
// =====================
const createReadlineInterface = () => {
  const readline = require('readline');
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
};

const askQuestion = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

const askYesNo = async (question: string): Promise<boolean> => {
  const answer = await askQuestion(`${question} (y/n): `);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
};

// =====================
// CORE FUNCTIONS
// =====================
const extractTranslationKeys = (filePath: string): Set<string> => {
  const keys = new Set<string>();
  if (!fs.existsSync(filePath)) {
    return keys;
  }
  
  const content = fs.readFileSync(filePath, "utf-8");
  try {
    const json = JSON.parse(content);
    const extractKeys = (obj: Record<string, unknown>, prefix = "") => {
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === "object" && obj[key] !== null) {
          extractKeys(obj[key] as Record<string, unknown>, fullKey);
        } else {
          keys.add(fullKey);
        }
      }
    };
    extractKeys(json);
  } catch (error) {
    console.warn(`⚠️  Invalid JSON in ${filePath}`);
  }
  return keys;
};

const scanFileForTranslationKeys = (filePath: string): {
  usedKeys: Set<string>;
  filesWithTFunction: boolean;
  dynamicKeys: Array<{ file: string; line: number; text: string }>;
  keysWithParams: Map<string, Array<{ file: string; line: number; params: string }>>;
} => {
  const usedKeys = new Set<string>();
  const keysWithParams = new Map<string, Array<{ file: string; line: number; params: string }>>();
  const dynamicKeys: Array<{ file: string; line: number; text: string }> = [];
  let filesWithTFunction = false;

  const sourceCode = fs.readFileSync(filePath, "utf-8");
  const isTsx = filePath.endsWith(".tsx");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const visit = (node: ts.Node) => {
    // Detect useTranslation destructuring: const { t } = useTranslation()
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.length > 0
    ) {
      const declaration = node.declarationList.declarations[0];
      if (
        ts.isVariableDeclaration(declaration) &&
        declaration.initializer &&
        ts.isCallExpression(declaration.initializer) &&
        ts.isIdentifier(declaration.initializer.expression) &&
        declaration.initializer.expression.text === "useTranslation" &&
        declaration.name &&
        ts.isObjectBindingPattern(declaration.name)
      ) {
        // Check if 't' is in the destructuring pattern
        const tBinding = declaration.name.elements.find(
          (element) =>
            ts.isBindingElement(element) &&
            element.name &&
            ts.isIdentifier(element.name) &&
            element.name.text === "t",
        );
        if (tBinding) {
          filesWithTFunction = true;
        }
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "t"
    ) {
      const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const firstArg = node.arguments[0];
      if (firstArg && ts.isStringLiteral(firstArg)) {
        const key = firstArg.text;
        usedKeys.add(key);
        
        // Check if t() has more than 1 argument (indicating parameters)
        if (node.arguments.length > 1) {
          const params = node.arguments
            .slice(1)
            .map((arg) => arg.getText(sourceFile))
            .join(", ");
          if (!keysWithParams.has(key)) {
            keysWithParams.set(key, []);
          }
          keysWithParams.get(key)!.push({
            file: path.relative(process.cwd(), filePath),
            line: pos.line + 1,
            params,
          });
        }
      } else if (firstArg) {
        dynamicKeys.push({
          file: path.relative(process.cwd(), filePath),
          line: pos.line + 1,
          text: firstArg.getText(sourceFile),
        });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return { usedKeys, filesWithTFunction, dynamicKeys, keysWithParams };
};

const walkDirectory = (dir: string, callback: (filePath: string) => void) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, callback);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
    ) {
      callback(fullPath);
    }
  }
};

// =====================
// MAIN DETECTION FUNCTION
// =====================
const detectUntranslatedKeys = async () => {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   DETECT UNTRANSLATED KEYS");
  console.log("   Frontend Translation Key Detector");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Check available directories
  const availableDirs = SCAN_DIRECTORIES.filter(dir => 
    fs.existsSync(path.join(process.cwd(), dir))
  );

  if (availableDirs.length === 0) {
    console.log("❌ No scan directories found. Expected:", SCAN_DIRECTORIES.join(", "));
    return;
  }

  console.log("📁 Available scan directories:");
  availableDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    const stats = fs.statSync(dirPath);
    console.log(`   - ${dir}/ (${stats.isDirectory() ? 'directory' : 'file'})`);
  });
  console.log("");

  // Collect all used keys
  const allUsedKeys = new Set<string>();
  const keyToFile = new Map<string, { file: string; line: number }>();
  const keysWithParams = new Map<string, Array<{ file: string; line: number; params: string }>>();
  const dynamicKeys: Array<{ file: string; line: number; text: string }> = [];
  const filesWithTFunction = new Set<string>();

  for (const dir of availableDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    console.log(`🔍 Scanning ${dir}/...`);
    
    walkDirectory(dirPath, (filePath) => {
      const result = scanFileForTranslationKeys(filePath);
      
      result.usedKeys.forEach(key => {
        allUsedKeys.add(key);
        // Track file for ALL keys (first occurrence)
        if (!keyToFile.has(key)) {
          const sourceCode = fs.readFileSync(filePath, "utf-8");
          const sourceFile = ts.createSourceFile(
            filePath,
            sourceCode,
            ts.ScriptTarget.Latest,
            true,
          );
          
          // Find the line number for this key
          const visit = (node: ts.Node) => {
            if (
              ts.isCallExpression(node) &&
              ts.isIdentifier(node.expression) &&
              node.expression.text === "t"
            ) {
              const firstArg = node.arguments[0];
              if (firstArg && ts.isStringLiteral(firstArg) && firstArg.text === key) {
                const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                keyToFile.set(key, {
                  file: path.relative(process.cwd(), filePath),
                  line: pos.line + 1,
                });
                return;
              }
            }
            ts.forEachChild(node, visit);
          };
          visit(sourceFile);
        }
      });

      if (result.filesWithTFunction) {
        filesWithTFunction.add(path.relative(process.cwd(), filePath));
      }

      result.dynamicKeys.forEach(dk => dynamicKeys.push(dk));
      
      result.keysWithParams.forEach((params, key) => {
        if (!keysWithParams.has(key)) {
          keysWithParams.set(key, []);
        }
        keysWithParams.get(key)!.push(...params);
      });
    });
  }

  // Load translation keys from the shared locale files
  const translationKeys = new Map<string, Set<string>>();

  for (const lang of SUPPORTED_LANGUAGES) {
    const filePath = path.join(LOCALES_DIR, lang, "translation.json");
    const keys = extractTranslationKeys(filePath);
    translationKeys.set(lang, keys);

    console.log(`📚 Loaded ${keys.size} keys from ${lang}/translation.json`);
  }
  console.log("");

  // Report files using react-i18next { t } function
  if (filesWithTFunction.size === 0) {
    console.log("ℹ️  No files using react-i18next { t } function found\n");
  } else {
    console.log(`🌍 Found ${filesWithTFunction.size} file(s) using react-i18next { t } function:\n`);
    Array.from(filesWithTFunction)
      .sort()
      .forEach((file) => console.log(`   - ${file}`));
    console.log("");
  }

  // Report used keys
  if (allUsedKeys.size === 0) {
    console.log("ℹ️  No static string keys passed to t() found\n");
    return;
  } else {
    console.log(`✅ Found ${allUsedKeys.size} static key(s) used in code:\n`);
    Array.from(allUsedKeys)
      .sort()
      .forEach((k) => console.log(`   - ${k}`));
    console.log("");
  }

  if (dynamicKeys.length > 0) {
    console.log(`⚠️  ${dynamicKeys.length} dynamic/non-literal argument(s) could not be checked:\n`);
    dynamicKeys.forEach((d) => {
      console.log(`   ${d.file}:${d.line} → ${d.text}`);
    });
    console.log("");
  }

  // Build a map of key -> { file, missingLangs, isComplexed }
  const keyInfoMap = new Map<
    string,
    { file: string; line: number; missingLangs: string[]; isComplexed: boolean }
  >();

  // For each used key, determine which languages it's missing from
  for (const key of allUsedKeys) {
    const missingLangs: string[] = [];
    for (const lang of SUPPORTED_LANGUAGES) {
      if (!translationKeys.get(lang)!.has(key)) {
        missingLangs.push(lang);
      }
    }

    if (missingLangs.length > 0) {
      const fileInfo = keyToFile.get(key);
      const file = fileInfo?.file ?? "unknown";
      const line = fileInfo?.line ?? 0;
      const isComplexed = keysWithParams.has(key);
      keyInfoMap.set(key, { file, line, missingLangs, isComplexed });
    }
  }

  // Console output - table format
  const totalMissing = keyInfoMap.size;
  if (totalMissing === 0) {
    console.log("✅ All keys are present in all languages!");
  } else {
    console.log(`❌ Found ${totalMissing} missing key(s) across languages\n`);
    console.log(
      "key".padEnd(35) + " " + "file".padEnd(40) + " " + "is complexed".padEnd(12) + " [langs]",
    );
    console.log("-".repeat(98));
    for (const [key, info] of keyInfoMap) {
      const keyStr = key.length > 34 ? key.substring(0, 31) + "..." : key;
      const fileStr = info.file.length > 39 ? info.file.substring(0, 36) + "..." : info.file;
      const complexedStr = info.isComplexed ? "✓" : "✗";
      console.log(
        keyStr.padEnd(35) + " " + fileStr.padEnd(40) + " " + complexedStr.padEnd(12) + " [" + info.missingLangs.join("/") + "]",
      );
    }
  }
  console.log("");

  // File output
  if (totalMissing > 0) {
    const shouldSave = await askYesNo("💾 Save missing keys to file?");
    if (shouldSave) {
      const outputDir = path.join(process.cwd(), "scripts", "output");
      const filePath = path.join(outputDir, "missing-keys.txt");

      // Ensure directory exists
      fs.mkdirSync(outputDir, { recursive: true });

      // Build file content in table format
      let content = "Missing Translation Keys Report\n";
      content += "Generated: " + new Date().toISOString() + "\n";
      content += "Scanned directories: " + availableDirs.join(", ") + "\n";
      content += "Total used keys: " + allUsedKeys.size + "\n";
      content += "Missing keys: " + totalMissing + "\n\n";
      content += "key".padEnd(35) + " " + "file".padEnd(40) + " " + "is complexed".padEnd(12) + " [langs]\n";
      content += "-".repeat(98) + "\n";

      for (const [key, info] of keyInfoMap) {
        const keyStr = key.length > 34 ? key.substring(0, 31) + "..." : key;
        const fileStr = info.file.length > 39 ? info.file.substring(0, 36) + "..." : info.file;
        const complexedStr = info.isComplexed ? "✓" : "✗";
        content += keyStr.padEnd(35) + " " + fileStr.padEnd(40) + " " + complexedStr.padEnd(12) + " [" + info.missingLangs.join("/") + "]\n";
      }

      fs.writeFileSync(filePath, content, "utf-8");
      console.log(`\n✅ Saved to: ${path.relative(process.cwd(), filePath)}\n`);
    }
  }

  console.log("🎉 Detection complete!\n");
};

// =====================
// EXECUTION
// =====================
if (require.main === module) {
  detectUntranslatedKeys().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
}

export { detectUntranslatedKeys };
