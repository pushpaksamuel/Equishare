import React from 'react';
import Card from '../components/common/Card';

const GroupsPage: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-bold">Groups</h1>
            <Card>
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold mb-2">Multi-Group Support</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        This feature is coming soon! For now, the app supports a single group.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default GroupsPage;