// init.js
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

const askYesNo = async (query) => {
  const answer = await askQuestion(`${query} (y/N): `);
  return answer.trim().toLowerCase() === 'y';
};

async function initProject() {
  console.log("🚀 Initializing New Project from Template...\n");

  // 0. Detect current folders dynamically
  const dirs = fs.readdirSync(__dirname, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const apiDir = dirs.find(d => d.endsWith('-api')) || 'khofkhof-api';
  const webDir = dirs.find(d => d.endsWith('-web')) || 'khofkhof-web';
  const typesDir = dirs.find(d => d.endsWith('-types')); // might be undefined

  // --- PROJECT NAME ---
  console.log("--- 🏷️  Project Identity ---");
  let projectName = "";
  while (!projectName) {
    let input = await askQuestion("Project Name (lowercase, no spaces) [my-project]: ");
    input = input || "my-project";

    // Sanitize input: lowercase, replace anything not a-z0-9 or hyphen with a hyphen
    input = input.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    // Remove multiple consecutive hyphens
    input = input.replace(/-+/g, '-');
    // Remove leading/trailing hyphens
    input = input.replace(/^-|-$/g, '');

    if (input.length > 0) {
      projectName = input;
    }
  }

  const githubRepo = await askQuestion("GitHub Repo for Types package (e.g. username/repo, leave empty to skip): ");

  const replacements = {
    api: {},
    web: {}
  };

  // --- MANDATORY CORE ---
  console.log("\n--- 📦 Core Configuration (Required) ---");
  const dbUrl = await askQuestion("🗄️ MongoDB Database URL [mongodb://localhost:27017]: ") || "mongodb://localhost:27017";
  const dbName = await askQuestion(`📁 Database Name [${projectName.replace(/-/g, '_')}]: `) || projectName.replace(/-/g, '_');
  const userJwt = await askQuestion("🔑 JWT Secret (leave empty to generate secure random): ");
  const jwtSecret = userJwt || crypto.randomBytes(32).toString('hex');
  const userEncKey = await askQuestion("🔒 Encryption Key (leave empty to generate secure random): ");
  const encKey = userEncKey || crypto.randomBytes(32).toString('hex');

  const apiUrl = await askQuestion("🌐 Web App - VITE_API_URL [http://localhost:45231/api]: ") || "http://localhost:45231/api";

  replacements.api['MONGODB_URI'] = dbUrl;
  replacements.api['MONGODB_DB'] = dbName;
  replacements.api['JWT_SECRET'] = jwtSecret;
  replacements.api['ENCRYPTION_KEY'] = encKey;
  replacements.web['VITE_API_URL'] = apiUrl;

  // --- GENERAL SERVER CONFIG ---
  if (await askYesNo("\n⚙️ Do you want to configure General Server settings (Port, Trusted Proxies)?")) {
    const port = await askQuestion("🔌 API_PORT [45231]: ") || "45231";
    const proxies = await askQuestion("🛡️ TRUSTED_PROXIES []: ");
    if (port) replacements.api['API_PORT'] = port;
    if (proxies) replacements.api['TRUSTED_PROXIES'] = proxies;
  }

  // --- FILE STORAGE ---
  if (await askYesNo("\n☁️ Do you want to configure File Storage (S3, Cloudinary, Supabase)?")) {
    const provider = await askQuestion("📦 STORAGE_PROVIDER (local, supabase, cloudinary, s3) [local]: ") || "local";
    replacements.api['STORAGE_PROVIDER'] = provider;

    if (provider === 's3') {
      replacements.api['AWS_REGION'] = await askQuestion("🌍 AWS_REGION: ");
      replacements.api['AWS_ACCESS_KEY_ID'] = await askQuestion("🔑 AWS_ACCESS_KEY_ID: ");
      replacements.api['AWS_SECRET_ACCESS_KEY'] = await askQuestion("🔒 AWS_SECRET_ACCESS_KEY: ");
      replacements.api['AWS_S3_BUCKET'] = await askQuestion("🪣 AWS_S3_BUCKET: ");
      replacements.api['AWS_S3_ENDPOINT'] = await askQuestion("🔗 AWS_S3_ENDPOINT: ");
    } else if (provider === 'cloudinary') {
      replacements.api['CLOUDINARY_CLOUD_NAME'] = await askQuestion("☁️ CLOUDINARY_CLOUD_NAME: ");
      replacements.api['CLOUDINARY_API_KEY'] = await askQuestion("🔑 CLOUDINARY_API_KEY: ");
      replacements.api['CLOUDINARY_API_SECRET'] = await askQuestion("🔒 CLOUDINARY_API_SECRET: ");
    } else if (provider === 'supabase') {
      replacements.api['SUPABASE_URL'] = await askQuestion("🔗 SUPABASE_URL: ");
      replacements.api['SUPABASE_SERVICE_ROLE_KEY'] = await askQuestion("🔑 SUPABASE_SERVICE_ROLE_KEY: ");
      replacements.api['SUPABASE_STORAGE_BUCKET'] = await askQuestion("🪣 SUPABASE_STORAGE_BUCKET: ");
    }
  }

  // --- SMS PROVIDERS ---
  if (await askYesNo("\n💬 Do you want to configure SMS Providers (ClickSend, Twilio, Plivo)?")) {
    const provider = await askQuestion("📱 SMS_PROVIDER (local, clicksend, plivo, twilio) [local]: ") || "local";
    replacements.api['SMS_PROVIDER'] = provider;

    if (provider === 'clicksend') {
      replacements.api['CLICKSEND_USERNAME'] = await askQuestion("👤 CLICKSEND_USERNAME: ");
      replacements.api['CLICKSEND_API_KEY'] = await askQuestion("🔑 CLICKSEND_API_KEY: ");
      replacements.api['CLICKSEND_SENDER_ID'] = await askQuestion("🪪 CLICKSEND_SENDER_ID: ");
    } else if (provider === 'twilio') {
      replacements.api['TWILIO_ACCOUNT_SID'] = await askQuestion("🪪 TWILIO_ACCOUNT_SID: ");
      replacements.api['TWILIO_AUTH_TOKEN'] = await askQuestion("🔑 TWILIO_AUTH_TOKEN: ");
      replacements.api['TWILIO_FROM_NUMBER'] = await askQuestion("📱 TWILIO_FROM_NUMBER: ");
    } else if (provider === 'plivo') {
      replacements.api['PLIVO_AUTH_ID'] = await askQuestion("🪪 PLIVO_AUTH_ID: ");
      replacements.api['PLIVO_AUTH_TOKEN'] = await askQuestion("🔑 PLIVO_AUTH_TOKEN: ");
      replacements.api['PLIVO_SENDER_NUMBER'] = await askQuestion("📱 PLIVO_SENDER_NUMBER: ");
    }
  }

  // --- PAYMENTS ---
  if (await askYesNo("\n💳 Do you want to configure Payments (Chargily, Stripe)?")) {
    const provider = await askQuestion("💸 PAY_PROVIDER (chargily, stripe) [chargily]: ") || "chargily";
    replacements.api['PAY_PROVIDER'] = provider;

    if (provider === 'chargily') {
      replacements.api['CHARGILY_SECRET_KEY'] = await askQuestion("🔑 CHARGILY_SECRET_KEY: ");
      replacements.api['CHARGILY_REDIRECT_URL'] = await askQuestion("↪️ CHARGILY_REDIRECT_URL: ");
      replacements.api['CHARGILY_WEBHOOK_URL'] = await askQuestion("🪝 CHARGILY_WEBHOOK_URL: ");
    } else if (provider === 'stripe') {
      replacements.api['STRIPE_SECRET_KEY'] = await askQuestion("🔑 STRIPE_SECRET_KEY: ");
      replacements.api['STRIPE_WEBHOOK_SECRET'] = await askQuestion("🪝 STRIPE_WEBHOOK_SECRET: ");
      replacements.api['STRIPE_REDIRECT_URL'] = await askQuestion("↪️ STRIPE_REDIRECT_URL: ");
    }
  }

  // --- SECURITY & INTEGRATIONS ---
  if (await askYesNo("\n🛡️ Do you want to configure API Security & Integrations (Turnstile, Google Calendar, VAPID)?")) {
    replacements.api['TURNSTILE_SECRET_KEY'] = await askQuestion("🤖 TURNSTILE_SECRET_KEY: ");
    replacements.web['VITE_TURNSTILE_SITE_KEY'] = await askQuestion("🤖 VITE_TURNSTILE_SITE_KEY: ");

    replacements.api['GOOGLE_CLIENT_ID'] = await askQuestion("📅 GOOGLE_CLIENT_ID: ");
    replacements.api['GOOGLE_CLIENT_SECRET'] = await askQuestion("📅 GOOGLE_CLIENT_SECRET: ");
    replacements.api['GOOGLE_REDIRECT_URI'] = await askQuestion("↪️ GOOGLE_REDIRECT_URI: ");
    replacements.web['VITE_GOOGLE_CLIENT_ID'] = replacements.api['GOOGLE_CLIENT_ID']; // reuse

    replacements.api['VAPID_PUBLIC_KEY'] = await askQuestion("🔔 VAPID_PUBLIC_KEY: ");
    replacements.api['VAPID_PRIVATE_KEY'] = await askQuestion("🔔 VAPID_PRIVATE_KEY: ");
    replacements.api['VAPID_SUBJECT'] = await askQuestion("📧 VAPID_SUBJECT (e.g. mailto:admin@domain.com): ");
  }

  // --- WEB APP LINKS ---
  if (await askYesNo("\n🔗 Do you want to configure Web App Links (Socials, App Store, Legal)?")) {
    replacements.web['VITE_FACEBOOK_URL'] = await askQuestion("📘 VITE_FACEBOOK_URL: ");
    replacements.web['VITE_TWITTER_URL'] = await askQuestion("🐦 VITE_TWITTER_URL: ");
    replacements.web['VITE_INSTAGRAM_URL'] = await askQuestion("📸 VITE_INSTAGRAM_URL: ");
    replacements.web['VITE_APP_URL'] = await askQuestion("🌍 VITE_APP_URL: ");
    replacements.web['VITE_APP_STORE_URL'] = await askQuestion("🍎 VITE_APP_STORE_URL: ");
    replacements.web['VITE_PLAY_STORE_URL'] = await askQuestion("▶️ VITE_PLAY_STORE_URL: ");
    replacements.web['VITE_TERMS_URL'] = await askQuestion("📜 VITE_TERMS_URL: ");
    replacements.web['VITE_PRIVACY_URL'] = await askQuestion("🔒 VITE_PRIVACY_URL: ");
  }

  console.log("\n📝 Writing configurations...");

  // Read example files (fail gracefully if they don't exist in the current setup)
  const apiExamplePath = path.join(__dirname, apiDir, '.env.example');
  const webExamplePath = path.join(__dirname, webDir, '.env.example');

  let apiEnv = "";
  let webEnv = "";

  if (fs.existsSync(apiExamplePath)) {
    apiEnv = fs.readFileSync(apiExamplePath, 'utf8');
  } else {
    console.warn(`⚠️ Warning: Could not find ${apiExamplePath}`);
  }

  if (fs.existsSync(webExamplePath)) {
    webEnv = fs.readFileSync(webExamplePath, 'utf8');
  } else {
    console.warn(`⚠️ Warning: Could not find ${webExamplePath}`);
  }

  // Engine for replacing keys
  const replaceEnv = (envString, dict) => {
    let result = envString;
    for (const [key, value] of Object.entries(dict)) {
      if (value !== undefined && value !== '') {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(result)) {
          result = result.replace(regex, `${key}=${value}`);
        } else {
          // If the key doesn't exist in the file, append it
          result += `\n${key}=${value}`;
        }
      }
    }
    return result;
  };

  // Replace
  apiEnv = replaceEnv(apiEnv, replacements.api);
  webEnv = replaceEnv(webEnv, replacements.web);

  // Write actual .env files
  if (apiEnv) {
    fs.writeFileSync(path.join(__dirname, apiDir, '.env'), apiEnv);
    console.log(`✅ Created ${apiDir}/.env`);
  }

  if (webEnv) {
    fs.writeFileSync(path.join(__dirname, webDir, '.env'), webEnv);
    console.log(`✅ Created ${webDir}/.env`);
  }

  // --- RENAME DIRECTORIES ---
  console.log("\n📁 Renaming project folders...");

  const foldersToRename = [];
  if (apiDir) foldersToRename.push({ oldName: apiDir, newSuffix: '-api' });
  if (webDir) foldersToRename.push({ oldName: webDir, newSuffix: '-web' });
  if (typesDir) foldersToRename.push({ oldName: typesDir, newSuffix: '-types' });

  for (const folder of foldersToRename) {
    const oldPath = path.join(__dirname, folder.oldName);
    const newName = `${projectName}${folder.newSuffix}`;
    const newPath = path.join(__dirname, newName);

    // Check if the current name is already the correct one
    if (folder.oldName !== newName && fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renamed ${folder.oldName} ➔ ${newName}`);
    } else if (folder.oldName === newName) {
      console.log(`👍 ${folder.oldName} is already correctly named.`);
    }

    // Update package.json name property
    const packageJsonPath = path.join(newPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkgData = fs.readFileSync(packageJsonPath, 'utf8');
        const pkg = JSON.parse(pkgData);
        let modified = false;

        const packageName = `@${projectName}/${folder.newSuffix.substring(1)}`;
        if (pkg.name !== packageName) {
          pkg.name = packageName;
          modified = true;
        }

        // Update app-types dependency if it exists
        const oldTypesName = 'app-types';
        const newTypesName = 'app-types';

        ['dependencies', 'devDependencies'].forEach(depType => {
          if (pkg[depType] && pkg[depType][oldTypesName]) {
            const oldVal = pkg[depType][oldTypesName];
            delete pkg[depType][oldTypesName];
            pkg[depType][newTypesName] = githubRepo ? `github:${githubRepo}` : oldVal;
            modified = true;
          }
        });

        if (modified) {
          fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
          console.log(`✅ Updated package.json in ${newName}`);
        }
      } catch (err) {
        console.warn(`⚠️ Warning: Could not update package.json in ${newName}: ${err.message}`);
      }
    }
  }

  // --- CUSTOM LOGO ---
  if (await askYesNo("\n🖼️ Do you want to add a custom project logo?")) {
    const logoPath = await askQuestion("Drag and drop your logo file here (or type the absolute path): ");

    // Clean the path (sometimes terminals add quotes around dragged files, or trailing spaces)
    const cleanPath = logoPath.replace(/['"]/g, '').trim();

    if (fs.existsSync(cleanPath)) {
      const publicDir = path.join(__dirname, `${projectName}-web`, 'public');
      // Ensure the public directory exists just in case
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const destPath = path.join(publicDir, 'logo.png');
      fs.copyFileSync(cleanPath, destPath);
      console.log(`✅ Logo copied successfully to ${projectName}-web/public/logo.png`);
    } else {
      console.log(`❌ File not found: ${cleanPath}`);
    }
  }

  console.log("\n🎉 Setup Complete! You are ready to start coding.");

  rl.close();
}

initProject();
