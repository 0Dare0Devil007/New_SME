import Link from "next/link";

// Figma asset URLs (valid for 7 days)
const icons = {
  logo: "https://www.figma.com/api/mcp/asset/5620935f-81a4-4a77-92b8-6f7daf97b245",
};

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <img src={icons.logo} alt="SME Directory" className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SME Directory</h1>
              <p className="text-xs text-gray-500">Learning Hub & Expert Network</p>
            </div>
          </Link>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-gray-200" />
        </div>
      </div>
    </header>
  );
}
