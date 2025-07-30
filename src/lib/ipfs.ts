// IPFS 元数据管理工具
// 使用 Pinata 服务来上传和管理 NFT 元数据

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
}

interface UploadResponse {
  success: boolean
  ipfsHash?: string
  error?: string
}

/**
 * 创建 NFT 元数据对象
 */
export function createNFTMetadata(
  tokenId: number,
  donationTier: number,
  climateTheme: string
): NFTMetadata {
  const tierNames = {
    1: '基础级',
    2: '青铜级', 
    3: '白银级',
    4: '黄金级',
    5: '钻石级'
  }

  const themeData = {
    FOREST: {
      name: '森林保护',
      description: '感谢您对森林保护的支持！这个NFT证明了您为保护全球森林生态系统做出的贡献。',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=500&fit=crop'
    },
    OCEAN: {
      name: '海洋保护',
      description: '感谢您对海洋保护的支持！这个NFT证明了您为保护海洋生态系统做出的贡献。',
      image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=500&h=500&fit=crop'
    },
    RENEWABLE: {
      name: '可再生能源',
      description: '感谢您对可再生能源的支持！这个NFT证明了您为推动清洁能源发展做出的贡献。',
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=500&fit=crop'
    },
    CARBON: {
      name: '碳中和',
      description: '感谢您对碳中和的支持！这个NFT证明了您为应对气候变化做出的贡献。',
      image: 'https://images.unsplash.com/photo-1497436072909-f5e4be1dfeaf?w=500&h=500&fit=crop'
    }
  }

  const theme = themeData[climateTheme as keyof typeof themeData] || themeData.FOREST
  const tierName = tierNames[donationTier as keyof typeof tierNames] || tierNames[1]

  return {
    name: `Climate NFT #${tokenId}`,
    description: theme.description,
    image: theme.image,
    attributes: [
      {
        trait_type: 'Donation Tier',
        value: tierName
      },
      {
        trait_type: 'Climate Theme',
        value: theme.name
      },
      {
        trait_type: 'Token ID',
        value: tokenId
      },
      {
        trait_type: 'Created At',
        value: new Date().toISOString()
      }
    ]
  }
}

/**
 * 上传元数据到 IPFS (使用 Pinata)
 * 在生产环境中，这应该在后端完成
 */
export async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<UploadResponse> {
  try {
    // 这里使用 Pinata API，需要在环境变量中配置 API 密钥
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY

    if (!pinataApiKey || !pinataSecretKey) {
      console.warn('Pinata API 密钥未配置，使用模拟 IPFS 哈希')
      // 返回模拟的 IPFS 哈希
      return {
        success: true,
        ipfsHash: `Qm${Math.random().toString(36).substring(2)}${Date.now()}`
      }
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: metadata.name,
          keyvalues: {
            climateTheme: metadata.attributes.find(attr => attr.trait_type === 'Climate Theme')?.value,
            donationTier: metadata.attributes.find(attr => attr.trait_type === 'Donation Tier')?.value
          }
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Pinata API 错误: ${response.statusText}`)
    }

    const result = await response.json()
    
    return {
      success: true,
      ipfsHash: result.IpfsHash
    }

  } catch (error) {
    console.error('上传到 IPFS 失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 获取 IPFS 内容的完整 URL
 */
export function getIPFSUrl(ipfsHash: string): string {
  // 使用多个 IPFS 网关以提高可用性
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
  ]
  
  // 随机选择一个网关
  const gateway = gateways[Math.floor(Math.random() * gateways.length)]
  return `${gateway}${ipfsHash}`
}

/**
 * 从 IPFS 获取元数据
 */
export async function getMetadataFromIPFS(ipfsHash: string): Promise<NFTMetadata | null> {
  try {
    const url = getIPFSUrl(ipfsHash)
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`获取 IPFS 内容失败: ${response.statusText}`)
    }
    
    const metadata = await response.json()
    return metadata as NFTMetadata

  } catch (error) {
    console.error('从 IPFS 获取元数据失败:', error)
    return null
  }
}

/**
 * 验证元数据格式
 */
export function validateMetadata(metadata: any): metadata is NFTMetadata {
  return (
    typeof metadata === 'object' &&
    typeof metadata.name === 'string' &&
    typeof metadata.description === 'string' &&
    typeof metadata.image === 'string' &&
    Array.isArray(metadata.attributes) &&
    metadata.attributes.every((attr: any) => 
      typeof attr === 'object' &&
      typeof attr.trait_type === 'string' &&
      (typeof attr.value === 'string' || typeof attr.value === 'number')
    )
  )
}