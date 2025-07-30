import NFTCollection from '../../components/nft/NFTCollection'

export default function NFTCollectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <NFTCollection title="My Climate NFT Collection" showStats={true} />
      </div>
    </div>
  )
}