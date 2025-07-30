import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("🚀 开始部署气候保护合约 (纯PHE + ETH模式)");
  console.log("基于Zama FHEVM的同态加密捐款平台");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");

  // 部署 ClimateProtectionPHE 主合约 (纯ETH模式)
  console.log("\n📦 部署 ClimateProtectionPHE 合约...");
  const ClimateProtectionPHE = await ethers.getContractFactory("ClimateProtectionPHE");
  const climateProtectionPHE = await ClimateProtectionPHE.deploy();
  await climateProtectionPHE.waitForDeployment();
  const climateProtectionAddress = await climateProtectionPHE.getAddress();
  console.log("✅ ClimateProtectionPHE 合约地址:", climateProtectionAddress);

  // 创建示例项目
  console.log("\n🌱 创建示例项目...");
  
  const sampleProjects = [
    {
      title: "Amazon Rainforest Conservation Plan",
      description: "Protect the Amazon rainforest ecosystem, reduce deforestation, and increase carbon absorption capacity. Use PHE technology to protect donor privacy.",
      targetAmount: ethers.parseEther("1"),
      duration: 86400 * 5
    },
  ];

  for (let i = 0; i < sampleProjects.length; i++) {
    const project = sampleProjects[i];
    try {
      const createTx = await climateProtectionPHE.createProject(
        project.title,
        project.description,
        project.targetAmount,
        project.duration
      );
      await createTx.wait();
      console.log(`✅ 项目 ${i + 1} "${project.title}" 创建成功`);
    } catch (error) {
      console.error(`❌ 创建项目 ${i + 1} 失败:`, error);
    }
  }

  // 验证部署
  console.log("\n🔍 验证部署...");
  try {
    const projectCount = await climateProtectionPHE.projectCounter();
    const activeCount = await climateProtectionPHE.getActiveProjectsCount();
    
    console.log("项目总数:", projectCount.toString());
    console.log("活跃项目数:", activeCount.toString());
    
    // 验证第一个项目
    if (projectCount > 0) {
      const projectInfo = await climateProtectionPHE.getProject(1);
      console.log("第一个项目:", projectInfo[0]);
    }
    
    console.log("✅ 部署验证通过");
  } catch (error) {
    console.error("❌ 部署验证失败:", error);
  }

  // 保存部署信息
  console.log("\n💾 保存部署信息...");
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    contracts: {
      climateProtectionPHE: climateProtectionAddress
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    
    // 合约验证信息
    verification: {
      climateProtectionPHE: {
        contractName: "ClimateProtectionPHE",
        sourceName: "contracts/ClimateProtectionPHE.sol",
        constructorArgs: []
      }
    },
    
    // 部署统计
    deploymentStats: {
      sampleProjectsCreated: sampleProjects.length,
      contractsDeployed: 1,
      gasUsed: "Optimized for PHE operations",
      features: [
        "FHE encrypted donations",
        "ETH-only payments", 
        "Oracle decryption",
        "Privacy-preserving comparisons"
      ]
    }
  };

  // 确保 deployments 目录存在
  if (!fs.existsSync("deployments")) {
    fs.mkdirSync("deployments");
  }

  fs.writeFileSync(
    "deployments/sepolia-phe-clean.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("✅ 部署信息已保存到 deployments/sepolia-phe-clean.json");

  // 生成环境变量
  console.log("\n⚙️ 生成环境变量...");
  const envContent = `# Sepolia 测试网环境变量 - PHE + ETH 纯净模式
NEXT_PUBLIC_CONTRACT_ADDRESS=${climateProtectionAddress}
`;

  fs.writeFileSync(".env.sepolia-phe", envContent);
  console.log("✅ 环境变量已保存到 .env.sepolia-phe");

  console.log("\n🎉 PHE + ETH 纯净模式部署完成!");
  console.log("\n📋 部署摘要:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 合约地址:", climateProtectionAddress);
  console.log("🌐 网络: Sepolia (Chain ID: 11155111)");
  console.log("👤 部署者:", deployer.address);
  console.log("📊 创建项目数:", sampleProjects.length);
  console.log("💡 模式: PHE + ETH (无代币依赖)");

  console.log("\n🔗 区块链浏览器:");
  console.log(`https://sepolia.etherscan.io/address/${climateProtectionAddress}`);

  console.log("\n📝 下一步操作:");
  console.log("1. 复制环境变量: cp .env.sepolia-phe-clean .env");
  console.log("2. 重启前端应用: npm run dev");
  console.log("3. 测试PHE加密捐款功能");
  console.log("4. 验证oracle解密功能");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });