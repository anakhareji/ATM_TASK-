import React from 'react';
import { CheckCircle } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';

const InsightsList = ({ insights = [], kpi, navigate }) => {
    return (
        <GlassCard className="w-full flex-1 shadow-sm bg-white border-gray-100 p-6 flex flex-col justify-center">
            <h3 className="text-lg font-black text-gray-900 mb-1">Insights & Actions</h3>
            <p className="text-sm font-bold text-gray-800 mb-5">Recommended Next Steps:</p>
            <div className="space-y-4">
                {insights.length > 0 ? (
                    insights.slice(0, 3).map((alert, idx) => (
                        <div key={idx} onClick={() => alert.link && navigate(alert.link)} className={`flex gap-3 text-sm font-medium transition-all ${alert.link ? 'cursor-pointer hover:text-orange-600' : 'text-gray-700'}`}>
                            <span className="font-bold text-gray-900">{idx + 1}.</span>
                            <span className="flex-1">{alert.msg} {alert.type === 'critical' ? '⚠️' : alert.type === 'event' ? '📅' : alert.type === 'warning' ? '🔍' : '✅'}</span>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle size={24} className="text-emerald-400 opacity-80"/>
                        </div>
                        <p className="text-sm font-bold text-gray-700">You're all caught up!</p>
                        <p className="text-[11px] text-gray-500 mt-1">No pending actions required.</p>
                    </div>
                )}
            </div>
            {kpi?.pending_approvals > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 shadow-lg text-white" onClick={() => window.location.href = '/dashboard/approvals'}>
                        Launch Approval Protocol
                    </Button>
                </div>
            )}
        </GlassCard>
    );
};

export default InsightsList;
