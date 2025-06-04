import { ethers } from "hardhat";

async function main() {
  console.log("Deploying CaseEscalationRegistry contract...");

  // Get the contract factory
  const CaseEscalationRegistry = await ethers.getContractFactory("CaseEscalationRegistry");

  // Deploy the contract
  const contract = await CaseEscalationRegistry.deploy();

  // Wait for deployment to finish
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("CaseEscalationRegistry deployed to:", contractAddress);

  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log("Deployed by:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: "localhost",
    timestamp: new Date().toISOString()
  };

  console.log("\n=== Deployment Info ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Test basic functionality
  console.log("\n=== Testing Basic Functionality ===");
  
  // Grant escalator role to deployer
  console.log("Granting ESCALATOR_ROLE to deployer...");
  const ESCALATOR_ROLE = await contract.ESCALATOR_ROLE();
  await contract.grantRole(ESCALATOR_ROLE, deployer.address);
  console.log("✓ ESCALATOR_ROLE granted");

  // Test filing a case
  const testCaseHash = ethers.keccak256(ethers.toUtf8Bytes("TEST_CASE_001"));
  console.log("Filing test case...");
  
  const tx = await contract.fileCase(
    testCaseHash,
    1, // High priority
    "Test escalation reason",
    "Test Jurisdiction"
  );
  
  await tx.wait();
  console.log("✓ Test case filed successfully");

  // Verify the case
  const escalation = await contract.getEscalation(testCaseHash);
  console.log("✓ Case verification successful");
  console.log("Case details:", {
    caseIdHash: escalation.caseIdHash,
    priority: escalation.priority,
    reason: escalation.reason,
    isActive: escalation.isActive
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });