import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

interface SimpleBarChartProps {
    title: string;
    data: ChartDataPoint[];
    height?: number;
    valueFormatter?: (value: number) => string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ 
    title, 
    data, 
    height = 200,
    valueFormatter = (value) => value.toLocaleString()
}) => {
    console.log('📊 SimpleBarChart received data:', data);
    
    if (!data || data.length === 0) {
        console.log('⚠️ No data for SimpleBarChart');
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center" style={{ height }}>
                    <div className="text-center text-gray-500">
                        Tidak ada data untuk ditampilkan
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxValue = Math.max(...data.map(d => d.value || 0));
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    
    console.log('📈 Bar chart calculation:', { maxValue, dataLength: data.length });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    {title}
                    <div className="text-sm font-normal text-gray-500">
                        Top {data.length} items
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4" style={{ height, overflowY: 'auto' }}>
                    {data.map((item, index) => {
                        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                        const color = item.color || colors[index % colors.length];
                        
                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700 truncate flex-1 mr-2">
                                        {item.label}
                                    </span>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900">
                                            {valueFormatter(item.value)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500 ease-out"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: color
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

interface SimpleLineChartProps {
    title: string;
    data: { 
        name?: string; 
        label?: string; 
        value: number; 
        date?: string;
    }[];
    height?: number;
    valueFormatter?: (value: number) => string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ 
    title, 
    data, 
    height = 200,
    valueFormatter = (value) => value.toString()
}) => {
    console.log('📊 SimpleLineChart rendering with data:', data);
    
    if (!data || data.length === 0) {
        console.log('⚠️ No data for SimpleLineChart');
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center" style={{ height }}>
                    <div className="text-center text-gray-500">
                        Tidak ada data untuk ditampilkan
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxValue = Math.max(...data.map(d => d.value || 0));
    const minValue = Math.min(...data.map(d => d.value || 0));
    const valueRange = maxValue - minValue || 1;
    
    const padding = 40;
    const chartWidth = Math.max(400, data.length * 60);
    const chartHeight = height - 80;
    
    console.log('📈 Chart calculation:', { maxValue, minValue, valueRange, chartWidth, chartHeight });
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    {title}
                    <div className="text-sm font-normal text-gray-500">
                        {data.length} data points
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height, overflowX: 'auto' }}>
                    <svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
                        <defs>
                            <linearGradient id={`chartGradient-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1"/>
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id={`lineGradient-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6"/>
                                <stop offset="100%" stopColor="#1d4ed8"/>
                            </linearGradient>
                            <filter id={`shadow-${title.replace(/\s+/g, '')}`} x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                            </filter>
                        </defs>
                        
                        {/* Grid lines */}
                        <g className="grid-lines" opacity="0.1">
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                const y = padding + (chartHeight - padding * 2) * ratio;
                                return (
                                    <line
                                        key={index}
                                        x1={padding}
                                        y1={y}
                                        x2={chartWidth - padding}
                                        y2={y}
                                        stroke="#374151"
                                        strokeWidth="1"
                                    />
                                );
                            })}
                        </g>
                        
                        {/* Chart area */}
                        {data.length > 1 && (
                            <>
                                {/* Area fill */}
                                <path
                                    d={`M ${padding} ${padding + chartHeight - padding * 2} ` +
                                        data.map((item, index) => {
                                            const x = padding + (index * (chartWidth - padding * 2)) / Math.max(1, data.length - 1);
                                            const y = padding + (chartHeight - padding * 2) * (1 - ((item.value || 0) - minValue) / valueRange);
                                            return `L ${x} ${y}`;
                                        }).join(' ') +
                                        ` L ${chartWidth - padding} ${padding + chartHeight - padding * 2} Z`}
                                    fill={`url(#chartGradient-${title.replace(/\s+/g, '')})`}
                                />
                                
                                {/* Line */}
                                <path
                                    d={`M ` + data.map((item, index) => {
                                        const x = padding + (index * (chartWidth - padding * 2)) / Math.max(1, data.length - 1);
                                        const y = padding + (chartHeight - padding * 2) * (1 - ((item.value || 0) - minValue) / valueRange);
                                        return `${x} ${y}`;
                                    }).join(' L ')}
                                    fill="none"
                                    stroke={`url(#lineGradient-${title.replace(/\s+/g, '')})`}
                                    strokeWidth="3"
                                    filter={`url(#shadow-${title.replace(/\s+/g, '')})`}
                                />
                            </>
                        )}
                        
                        {/* Data points */}
                        {data.map((item, index) => {
                            const x = padding + (index * (chartWidth - padding * 2)) / Math.max(1, data.length - 1);
                            const y = padding + (chartHeight - padding * 2) * (1 - ((item.value || 0) - minValue) / valueRange);
                            const displayLabel = item.label || item.name || `Point ${index + 1}`;
                            
                            return (
                                <g key={index}>
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="6"
                                        fill="#3b82f6"
                                        stroke="white"
                                        strokeWidth="2"
                                        className="hover:r-8 transition-all cursor-pointer"
                                        filter={`url(#shadow-${title.replace(/\s+/g, '')})`}
                                    >
                                        <title>{`${displayLabel}: ${valueFormatter(item.value || 0)}`}</title>
                                    </circle>
                                    
                                    {/* X-axis labels */}
                                    {index % Math.ceil(data.length / 6) === 0 && (
                                        <text
                                            x={x}
                                            y={height - 10}
                                            textAnchor="middle"
                                            fontSize="11"
                                            fill="#6b7280"
                                        >
                                            {displayLabel.length > 8 ? displayLabel.substring(0, 8) + '...' : displayLabel}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                        
                        {/* Y-axis labels */}
                        {[0, 0.5, 1].map((ratio, index) => {
                            const value = minValue + (maxValue - minValue) * (1 - ratio);
                            const y = padding + (chartHeight - padding * 2) * ratio;
                            return (
                                <text
                                    key={index}
                                    x={padding - 10}
                                    y={y + 5}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#6b7280"
                                >
                                    {valueFormatter(value)}
                                </text>
                            );
                        })}
                    </svg>
                </div>
            </CardContent>
        </Card>
    );
};

interface PieChartProps {
    title: string;
    data: ChartDataPoint[];
    height?: number;
    showLegend?: boolean;
}

export const SimplePieChart: React.FC<PieChartProps> = ({ 
    title, 
    data, 
    height = 200,
    showLegend = true
}) => {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center" style={{ height }}>
                    <div className="text-center text-gray-500">
                        Tidak ada data untuk ditampilkan
                    </div>
                </CardContent>
            </Card>
        );
    }

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let cumulativePercentage = 0;
    
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    
    const radius = height / 2 - 20;
    const center = height / 2;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    {title}
                    <div className="text-sm font-normal text-gray-500">
                        Total: {data.length} items
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-6">
                    <div style={{ width: height, height }}>
                        <svg width={height} height={height} viewBox={`0 0 ${height} ${height}`}>
                            <defs>
                                <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                                </filter>
                            </defs>
                            
                            {data.map((item, index) => {
                                const percentage = (item.value / total) * 100;
                                const angle = (percentage / 100) * 360;
                                const startAngle = (cumulativePercentage / 100) * 360;
                                const endAngle = startAngle + angle;
                                
                                const x1 = center + radius * Math.cos((startAngle - 90) * Math.PI / 180);
                                const y1 = center + radius * Math.sin((startAngle - 90) * Math.PI / 180);
                                const x2 = center + radius * Math.cos((endAngle - 90) * Math.PI / 180);
                                const y2 = center + radius * Math.sin((endAngle - 90) * Math.PI / 180);
                                
                                const largeArcFlag = angle > 180 ? 1 : 0;
                                
                                const pathData = [
                                    `M ${center} ${center}`,
                                    `L ${x1} ${y1}`,
                                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                    'Z'
                                ].join(' ');
                                
                                cumulativePercentage += percentage;
                                
                                return (
                                    <g key={index}>
                                        <path
                                            d={pathData}
                                            fill={item.color || colors[index % colors.length]}
                                            className="hover:opacity-80 transition-all cursor-pointer"
                                            filter="url(#dropshadow)"
                                            stroke="white"
                                            strokeWidth="2"
                                        >
                                            <title>{`${item.label}: ${percentage.toFixed(1)}%`}</title>
                                        </path>
                                        {percentage > 5 && (
                                            <text
                                                x={center + (radius * 0.7) * Math.cos(((startAngle + endAngle) / 2 - 90) * Math.PI / 180)}
                                                y={center + (radius * 0.7) * Math.sin(((startAngle + endAngle) / 2 - 90) * Math.PI / 180)}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fontSize="12"
                                                fontWeight="bold"
                                                fill="white"
                                            >
                                                {percentage.toFixed(0)}%
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                            
                            <circle
                                cx={center}
                                cy={center}
                                r={radius * 0.4}
                                fill="white"
                                filter="url(#dropshadow)"
                            />
                            <text
                                x={center}
                                y={center - 5}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="14"
                                fontWeight="bold"
                                fill="#374151"
                            >
                                Total
                            </text>
                            <text
                                x={center}
                                y={center + 15}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="12"
                                fill="#6b7280"
                            >
                                {data.length} items
                            </text>
                        </svg>
                    </div>
                    
                    {showLegend && (
                        <div className="flex-1 space-y-3 max-h-60 overflow-y-auto">
                            {data.map((item, index) => (
                                <div key={index} className="flex items-center justify-between space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-2">
                                        <div 
                                            className="w-4 h-4 rounded-full shadow-sm"
                                            style={{ 
                                                backgroundColor: item.color || colors[index % colors.length] 
                                            }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900">
                                            {((item.value / total) * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {item.value.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
