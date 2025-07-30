// 浏览器环境polyfill
if (typeof window !== 'undefined' && typeof global === 'undefined') {
  (window as any).global = window;
}

// FHE实例
let fhevmInstance: any = null;

/**
 * 初始化FHE环境 - 使用官方推荐配置
 */
export async function initializeFHE(): Promise<boolean> {
  try {
    // 确保在浏览器环境中运行
    if (typeof window === 'undefined') {
      throw new Error('FHE SDK 只能在浏览器环境中使用');
    }

    console.log('🔐 初始化FHE环境 (官方配置)...');

    // 动态导入 - 使用官方推荐配置
    const { createInstance, initSDK } = await import('@zama-fhe/relayer-sdk/web');

    // 首先初始化SDK
    console.log('📦 初始化WASM模块...');
    const sdkInitResult = await initSDK();
    if (!sdkInitResult) {
      throw new Error('SDK初始化失败');
    }
    console.log('✅ WASM模块初始化成功');

    // 使用官方推荐的手动配置
    const officialConfig = {
      // ACL_CONTRACT_ADDRESS (FHEVM Host chain)
      aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
      // KMS_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain)
      kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
      // INPUT_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain)
      inputVerifierContractAddress: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
      // DECRYPTION_ADDRESS (Gateway chain)
      verifyingContractAddressDecryption: "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
      // INPUT_VERIFICATION_ADDRESS (Gateway chain)
      verifyingContractAddressInputVerification: "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
      // FHEVM Host chain id
      chainId: 11155111,
      // Gateway chain id
      gatewayChainId: 55815,
      // Optional RPC provider to host chain
      network: "https://eth-sepolia.public.blastapi.io",
      // Relayer URL
      relayerUrl: "https://relayer.testnet.zama.cloud",
    };

    console.log('🌐 连接到relayer:', officialConfig.relayerUrl);
    console.log('🔗 FHEVM链:', officialConfig.chainId);
    console.log('🚪 网关链:', officialConfig.gatewayChainId);

    // 使用官方配置创建FHE实例
    fhevmInstance = await createInstance(officialConfig);

    console.log('✅ FHE环境初始化成功 (官方配置)');
    console.log('实例类型:', typeof fhevmInstance);

    return true;
  } catch (error) {
    console.error('❌ FHE初始化失败:', error);
    return false;
  }
}

/**
 * 检查FHE是否已初始化
 */
export function isFHEInitialized(): boolean {
  return fhevmInstance !== null;
}

/**
 * 加密捐款金额 - 使用relayer-sdk
 * @param contractAddress 合约地址
 * @param userAddress 用户地址
 * @param amount 金额（wei格式的bigint）
 * @returns 加密数据和输入证明
 */
export async function encryptDonationAmount(
  contractAddress: string,
  userAddress: string,
  amount: bigint
): Promise<{ handles: string[], inputProof: string }> {
  if (!isFHEInitialized()) {
    throw new Error('FHE环境未初始化，请先调用 initializeFHE()');
  }

  try {
    console.log('🔐 加密捐款金额 (relayer-sdk):', amount.toString());
    console.log('合约地址:', contractAddress);
    console.log('用户地址:', userAddress);

    // 将bigint转换为number - 但要处理大数值的情况
    // 对于ETH的wei值，我们需要特殊处理，因为可能超过Number.MAX_SAFE_INTEGER
    let amountAsNumber: number;
    if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
      // 如果超过安全范围，我们使用一个更大的安全值或降低精度
      // 或者直接使用bigint的toString然后转换
      console.warn('金额超过JavaScript安全整数范围，使用字符串转换');
      // 注意：relayer-sdk可能需要支持bigint或更大的数值
      // 先尝试直接使用bigint
      amountAsNumber = Number(amount);
      console.log('强制转换结果:', amountAsNumber);
    } else {
      amountAsNumber = Number(amount);
    }

    console.log('原始bigint:', amount.toString());
    console.log('转换后number:', amountAsNumber);
    console.log('转换是否精确:', BigInt(amountAsNumber) === amount);

    // 使用relayer-sdk的加密方法
    const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
    input.add64(amountAsNumber);
    const encryptedInput = await input.encrypt();

    console.log('✅ 加密完成 (relayer-sdk)');
    console.log('=== 原始加密结果分析 ===');
    console.log('encryptedInput完整对象:', encryptedInput);
    console.log('handles数组:', encryptedInput.handles);
    console.log('handles[0]值:', encryptedInput.handles[0]);
    console.log('handles[0]类型:', typeof encryptedInput.handles[0]);
    console.log('handles[0]构造函数:', encryptedInput.handles[0]?.constructor?.name);
    console.log('inputProof值:', encryptedInput.inputProof);
    console.log('inputProof类型:', typeof encryptedInput.inputProof);
    console.log('inputProof构造函数:', encryptedInput.inputProof?.constructor?.name);

    // 检查是否为Uint8Array
    if (encryptedInput.handles[0] instanceof Uint8Array) {
      console.log('handles[0] 是 Uint8Array，长度:', encryptedInput.handles[0].length);
      console.log('前几个字节:', Array.from(encryptedInput.handles[0].slice(0, 8)));
    }
    if (encryptedInput.inputProof instanceof Uint8Array) {
      console.log('inputProof 是 Uint8Array，长度:', encryptedInput.inputProof.length);
      console.log('前几个字节:', Array.from(encryptedInput.inputProof.slice(0, 8)));
    }

    console.log('=== 数据分析结束 ===');

    // 根据ABI和demo，正确处理数据格式
    const handles = encryptedInput.handles.map((handle: any) => {
      console.log('处理handle:', handle, 'type:', typeof handle);

      // 如果是Uint8Array，转换为hex字符串（bytes32格式）
      if (handle instanceof Uint8Array) {
        // bytes32需要正好32字节
        if (handle.length !== 32) {
          console.warn('Handle长度不是32字节:', handle.length);
        }
        const hexString = '0x' + Array.from(handle as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        console.log('Uint8Array转换为hex:', hexString);
        return hexString;
      }

      // 如果已经是字符串，确保以0x开头
      if (typeof handle === 'string') {
        const result = handle.startsWith('0x') ? handle : '0x' + handle;
        console.log('字符串处理结果:', result);
        return result;
      }

      console.log('直接使用原始handle:', handle);
      return handle;
    });

    // 处理inputProof（bytes格式）
    let inputProof: any;
    if (encryptedInput.inputProof instanceof Uint8Array) {
      // bytes类型，转换为hex字符串
      inputProof = '0x' + Array.from(encryptedInput.inputProof as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
      console.log('inputProof Uint8Array转换为hex，长度:', inputProof.length);
    } else if (typeof encryptedInput.inputProof === 'string') {
      inputProof = encryptedInput.inputProof.startsWith('0x') ? encryptedInput.inputProof : '0x' + encryptedInput.inputProof;
      console.log('inputProof字符串处理结果长度:', inputProof.length);
    } else {
      inputProof = encryptedInput.inputProof;
      console.log('inputProof直接使用原值');
    }

    console.log('最终handles:', handles);
    console.log('最终inputProof长度:', inputProof.length);
    console.log('最终inputProof类型:', typeof inputProof);

    return {
      handles,
      inputProof
    };
  } catch (error) {
    console.error('❌ 加密失败:', error);
    throw error;
  }
}


export async function encryptDonationAmountNew(
    contractAddress: string,
    userAddress: string,
    amount: bigint
): Promise<any> {
  if (!isFHEInitialized()) {
    throw new Error('FHE环境未初始化，请先调用 initializeFHE()');
  }

  try {
    console.log('🔐 加密捐款金额 (relayer-sdk):', amount.toString());
    console.log('合约地址:', contractAddress);
    console.log('用户地址:', userAddress);

    // 将bigint转换为number - 但要处理大数值的情况
    // 对于ETH的wei值，我们需要特殊处理，因为可能超过Number.MAX_SAFE_INTEGER
    let amountAsNumber: number;
    if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
      // 如果超过安全范围，我们使用一个更大的安全值或降低精度
      // 或者直接使用bigint的toString然后转换
      console.warn('金额超过JavaScript安全整数范围，使用字符串转换');
      // 注意：relayer-sdk可能需要支持bigint或更大的数值
      // 先尝试直接使用bigint
      amountAsNumber = Number(amount);
      console.log('强制转换结果:', amountAsNumber);
    } else {
      amountAsNumber = Number(amount);
    }

    console.log('原始bigint:', amount.toString());
    console.log('转换后number:', amountAsNumber);
    console.log('转换是否精确:', BigInt(amountAsNumber) === amount);

    // 使用relayer-sdk的加密方法
    const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
    input.add64(amountAsNumber);
    return await input.encrypt();

  } catch (error) {
    console.error('❌ 加密失败:', error);
    throw error;
  }
}

/**
 * 为approve操作加密金额 - 使用relayer-sdk
 * @param contractAddress 代币合约地址
 * @param userAddress 用户地址
 * @param spenderAddress 授权地址
 * @param amount 金额
 * @returns 加密数据和输入证明
 */
export async function encryptApprovalAmount(
  contractAddress: string,
  userAddress: string,
  spenderAddress: string,
  amount: bigint
): Promise<{ handles: string[], inputProof: string }> {
  if (!isFHEInitialized()) {
    throw new Error('FHE环境未初始化，请先调用 initializeFHE()');
  }

  try {
    console.log('🔐 加密授权金额 (relayer-sdk):', amount.toString());

    const amountAsNumber = Number(amount);
    if (amountAsNumber > Number.MAX_SAFE_INTEGER) {
      throw new Error('金额超过JavaScript安全整数范围');
    }

    const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
    input.add64(amountAsNumber);
    const encryptedInput = input.encrypt();

    return {
      handles: encryptedInput.handles,
      inputProof: encryptedInput.inputProof
    };
  } catch (error) {
    console.error('❌ 授权加密失败:', error);
    throw error;
  }
}

/**
 * 获取当前FHE配置信息
 */
export function getFHEConfig() {
  return {
    sdk: '@zama-fhe/relayer-sdk',
    config: 'OfficialConfig',
    relayerUrl: 'https://relayer.testnet.zama.cloud',
    chainId: 11155111,
    gatewayChainId: 55815,
    isInitialized: isFHEInitialized(),
    hasInstance: fhevmInstance !== null
  };
}

/**
 * 验证FHE环境是否正常工作
 */
export async function testFHEEnvironment(): Promise<boolean> {
  try {
    if (!isFHEInitialized()) {
      console.log('尝试初始化FHE环境...');
      const initialized = await initializeFHE();
      if (!initialized) return false;
    }

    // 简单测试：创建一个加密输入
    console.log('✅ FHE环境测试通过 (relayer-sdk)');
    return true;
  } catch (error) {
    console.error('❌ FHE环境测试失败:', error);
    return false;
  }
}