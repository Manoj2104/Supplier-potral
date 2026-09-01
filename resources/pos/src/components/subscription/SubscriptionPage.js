import React, { useState, useEffect } from 'react';
import MasterLayout from '../MasterLayout';
import TabTitle from '../../shared/tab-title/TabTitle';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import EnterpriseSubscriptionBanner from '../dashboard/EnterpriseSubscriptionBanner';
import FormPageSkeleton from '../../shared/components/skeletons/FormPageSkeleton';
import { isPageFirstLoad, markPageAnimated } from '../dashboard/dashboardAnimationState';
import './SubscriptionPage.css';

const SubscriptionPage = () => {
    const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(isPageFirstLoad('subscription'));

    useEffect(() => {
        if (isLoadingSkeleton) {
            const timer = setTimeout(() => {
                setIsLoadingSkeleton(false);
                markPageAnimated('subscription');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isLoadingSkeleton]);

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title="Billing & Subscription — INFY-POS Enterprise" />
            {isLoadingSkeleton ? (
                <FormPageSkeleton />
            ) : (
                <div className="subscription-full-page">
                    <EnterpriseSubscriptionBanner />
                </div>
            )}
        </MasterLayout>
    );
};

export default SubscriptionPage;
