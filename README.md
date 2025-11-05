# Create project folder
mkdir terraform-automation-demo
cd terraform-automation-demo

# Initialize Node project
npm init -y

# Install TypeScript + tooling
npm install --save-dev typescript ts-node @types/node

# Create directories
mkdir -p backend/terraform backend/runs

# Create sample backend entry file
cat > backend/index.ts <<'EOF'
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const TEMPLATE_DIR = path.resolve("./backend/terraform");
const RUNS_DIR = path.resolve("./backend/runs");

function runCommand(cmd: string, cwd: string): string {
  console.log("→", cmd);
  const output = execSync(cmd, { cwd, stdio: "pipe" }).toString();
  console.log(output);
  return output;
}

async function deployS3(bucketName: string): Promise<void> {
  const runDir = path.join(RUNS_DIR, bucketName);
  fs.mkdirSync(runDir, { recursive: true });

  for (const file of fs.readdirSync(TEMPLATE_DIR)) {
    fs.copyFileSync(path.join(TEMPLATE_DIR, file), path.join(runDir, file));
  }

  const tfvars = `bucket_name = "${bucketName}"
region = "us-east-1"
`;
  fs.writeFileSync(path.join(runDir, "terraform.tfvars"), tfvars);

  runCommand("terraform init -input=false", runDir);
  runCommand("terraform apply -auto-approve -input=false -var-file=terraform.tfvars", runDir);

  const output = runCommand("terraform output -json", runDir);
  console.log("Terraform output:", output);
}

(async () => {
  try {
    const bucketName = \`capstone-demo-\${Date.now()}\`;
    await deployS3(bucketName);
    console.log("✅ Deployment complete!");
  } catch (err) {
    console.error("❌ Deployment failed:", err);
  }
})();
EOF

# Create Terraform files
cat > backend/terraform/main.tf <<'EOF'
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

resource "aws_s3_bucket" "demo_bucket" {
  bucket = var.bucket_name

  tags = {
    Project = "CapstoneDemo"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.demo_bucket.bucket
}
EOF

cat > backend/terraform/variables.tf <<'EOF'
variable "region" {
  type    = string
  default = "us-east-1"
}

variable "bucket_name" {
  type = string
}
EOF

# Create tsconfig.json
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "rootDir": "./backend",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["backend/**/*.ts"]
}
EOF

# Update package.json scripts
npx npm-add-script -k "start" -v "ts-node backend/index.ts"
npx npm-add-script -k "build" -v "tsc"

echo "✅ TypeScript + Terraform automation project created successfully!"
echo ""
echo "Next steps:"
echo "1. Ensure Terraform CLI is installed and AWS credentials are configured."
echo "2. Run 'npm install' if needed."
echo "3. Run 'npm run start' to create an S3 bucket via Terraform."
