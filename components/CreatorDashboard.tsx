import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NavigationProps } from '../types';
import { dashboardChartData } from '../lib/mock-data';
import Button from './ui/Button';
import SubscriptionManager from './SubscriptionManager';

const CreatorDashboard: React.FC<NavigationProps> = ({ onNavigate }) => {

    const renderGradient = () => (
        <defs>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF0050" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#7928CA" stopOpacity={0.1}/>
            </linearGradient>
        </defs>
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 md:mb-0">
            <h1 className="text-4xl font-satoshi font-bold mb-8">Dashboard</h1>
            
            {/* Earnings Graph */}
            <div className="bg-card p-6 rounded-2xl mb-8">
                <h2 className="text-xl font-satoshi font-bold mb-4">Earnings (7 days)</h2>
                 <p className="text-4xl font-bold text-primary mb-4">$18,430.00</p>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={dashboardChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                           {renderGradient()}
                            <CartesianGrid strokeDasharray="3 3" stroke="#37373b" />
                            <XAxis dataKey="name" stroke="#A0A0A0" />
                            <YAxis stroke="#A0A0A0" />
                            <Tooltip contentStyle={{ backgroundColor: '#1A1A1D', border: 'none', borderRadius: '10px' }} />
                            <Area type="monotone" dataKey="earnings" stroke="#FF0050" fillOpacity={1} fill="url(#colorEarnings)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Subscription Management */}
            <div className="mb-8">
                <SubscriptionManager mode="creator" />
            </div>

            {/* Other Cards */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* Recent Uploads */}
                <div className="bg-card p-6 rounded-2xl">
                    <h3 className="font-satoshi font-bold text-lg mb-4">Recent Uploads</h3>
                    <div className="space-y-3">
                        {['Video Title 1', 'Video Title 2', 'Video Title 3'].map(title => (
                            <div key={title} className="flex items-center justify-between text-sm">
                                <span>{title}</span>
                                <span className="text-green-400">$250.50</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subscribers */}
                 <div className="bg-card p-6 rounded-2xl">
                    <h3 className="font-satoshi font-bold text-lg mb-4">Subscriber NFTs</h3>
                     <div className="space-y-2">
                         <p>Tier 1: 150 holders</p>
                         <p>Tier 2: 45 holders</p>
                         <p>Tier 3: 12 holders</p>
                     </div>
                </div>

                {/* Withdraw */}
                 <div className="bg-card p-6 rounded-2xl flex flex-col justify-between">
                    <h3 className="font-satoshi font-bold text-lg mb-4">Withdraw Earnings</h3>
                    <p className="text-text-secondary mb-4">Available balance can be withdrawn to your connected wallet.</p>
                    <Button variant="primary">Withdraw $18,430</Button>
                </div>
            </div>
        </div>
    );
};

export default CreatorDashboard;
