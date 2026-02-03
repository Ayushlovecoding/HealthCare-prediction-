/**
 * Stats Card Component
 * Displays dashboard statistics
 */
const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend = null }) => {
  const colorStyles = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  }

  return (
    <div className="card flex items-center space-x-3 sm:space-x-4">
      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${colorStyles[color]} flex-shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
      {trend !== null && (
        <div className={`text-xs sm:text-sm font-medium flex-shrink-0 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}

export default StatsCard
