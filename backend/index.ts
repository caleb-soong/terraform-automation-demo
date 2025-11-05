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

/**
 * Deploy an S3 bucket using Terraform.
 * @param bucketName A globally unique bucket name
 */
async function deployS3(bucketName: string): Promise<void> {
  const runDir = path.join(RUNS_DIR, bucketName);
  fs.mkdirSync(runDir, { recursive: true });

  // Copy template files
  for (const file of fs.readdirSync(TEMPLATE_DIR)) {
    fs.copyFileSync(path.join(TEMPLATE_DIR, file), path.join(runDir, file));
  }

  // Write tfvars file
  const tfvars = `bucket_name = "${bucketName}"
region = "us-east-1"
`;
  fs.writeFileSync(path.join(runDir, "terraform.tfvars"), tfvars);

  // Run Terraform commands
  runCommand("terraform init -input=false", runDir);
  runCommand("terraform apply -auto-approve -input=false -var-file=terraform.tfvars", runDir);

  const output = runCommand("terraform output -json", runDir);
  console.log("Terraform output:", output);
}

(async () => {
  try {
    const bucketName = `capstone-demo-${Date.now()}`;
    await deployS3(bucketName);
    console.log("✅ Deployment complete!");
  } catch (err) {
    console.error("❌ Deployment failed:", err);
  }
})();
