export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          🎉 前端测试页面
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-green-800 font-semibold">✅ Next.js 运行正常</h3>
            <p className="text-green-700 text-sm">React 组件渲染成功</p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-semibold">🎨 Tailwind CSS 正常</h3>
            <p className="text-blue-700 text-sm">样式加载成功</p>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
            <h3 className="text-purple-800 font-semibold">🚀 准备就绪</h3>
            <p className="text-purple-700 text-sm">可以进行应用测试</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a 
            href="/"
            className="inline-block bg-climate-green-600 text-white px-6 py-2 rounded-md hover:bg-climate-green-700 transition-colors"
          >
            回到主页
          </a>
        </div>
      </div>
    </div>
  )
}