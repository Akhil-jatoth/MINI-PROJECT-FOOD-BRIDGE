const StatsCard = ({ icon, label, value, color = 'brand', trend }) => {
  const colors = {
    brand:  'from-brand-500  to-brand-400  shadow-brand-200',
    blue:   'from-blue-500   to-blue-400   shadow-blue-200',
    yellow: 'from-yellow-500 to-yellow-400 shadow-yellow-200',
    red:    'from-red-500    to-red-400    shadow-red-200',
    purple: 'from-purple-500 to-purple-400 shadow-purple-200',
    teal:   'from-teal-500   to-teal-400   shadow-teal-200',
  };

  return (
    <div className="stat-card animate-slide-up">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        {trend !== undefined && (
          <p className={`text-xs mt-0.5 font-semibold ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)} this week
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
