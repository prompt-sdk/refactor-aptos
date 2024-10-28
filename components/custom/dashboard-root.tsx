'use client';

import { Session } from "next-auth";
import classNames from 'classnames';
import DashboardProfile from "./dashboard-profile";
import DashboardWidget from "./dashboard-widget";
import { WidgetSelectionModal } from './widget-selection-modal';

export function Dashboard({
    session
}: {
    session: Session | null;
}) {
    return (
        <div className={classNames('flex w-full grow items-center justify-center py-4')}>
            <div className="container flex flex-col items-center justify-center gap-6">
                <DashboardProfile session={session} />
                <DashboardWidget session={session} />
                <WidgetSelectionModal session={session} />
            </div>
        </div>
    )
}