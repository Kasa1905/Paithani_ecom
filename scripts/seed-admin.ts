import fs from "fs";
import path from "path";
import connectDB from "../src/lib/mongodb.js";
import User from "../src/models/User.js";

const __dirname = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
const envPath = path.resolve(__dirname, "../.env.local");

if (!process.env.MONGODB_URI && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith("MONGODB_URI=")) continue;
    const [, ...rest] = line.split("=");
    let value = rest.join("=").trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (value) process.env.MONGODB_URI = value;
    break;
  }
}

async function seedAdmin() {
  await connectDB();

  const adminEmail = "sambekaushik@gmail.com";

  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }

  await User.create({
    email: adminEmail,
    name: "Admin",
    role: "admin"
  });

  console.log("Admin user created");
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});