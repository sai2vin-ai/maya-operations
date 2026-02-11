import { NAV_GROUPS, DASHBOARD_NAV_ITEM } from '../../config/navigation';
import { ROLE_DEFINITIONS, ROLE_COLORS } from '../../config/roles';

export default function NavigationTab() {
    const allGroups = [{ id: 'ungrouped', label: 'General', items: [DASHBOARD_NAV_ITEM] }, ...NAV_GROUPS];

    return (
        <div>
            <p className="text-foreground-muted text-sm mb-4">Shows which sidebar modules are visible for each role.</p>

            <div className="glass-card overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left p-4 text-foreground-muted font-medium min-w-[180px]">Module</th>
                            {ROLE_DEFINITIONS.map((role) => (
                                <th key={role.value} className="p-3 text-center">
                                    <span
                                        className={`inline-block px-2 py-1 rounded text-xs font-medium border ${ROLE_COLORS[role.color]}`}
                                    >
                                        {role.label}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {allGroups.map((group) => (
                            <GroupRows key={group.id} group={group} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function GroupRows({
    group,
}: {
    group: { id: string; label: string; items: { id: string; label: string; roles: string[] }[] };
}) {
    return (
        <>
            {/* Group header */}
            <tr className="bg-surface-secondary/50">
                <td
                    colSpan={ROLE_DEFINITIONS.length + 1}
                    className="p-3 text-xs font-semibold uppercase tracking-wider text-foreground-faint"
                >
                    {group.label}
                </td>
            </tr>
            {/* Items */}
            {group.items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-surface-secondary">
                    <td className="p-3 pl-6 text-foreground">{item.label}</td>
                    {ROLE_DEFINITIONS.map((role) => (
                        <td key={role.value} className="p-3 text-center">
                            {item.roles.includes(role.value) ? (
                                <span className="text-green-400" title="Visible">
                                    &#10003;
                                </span>
                            ) : (
                                <span className="text-foreground-faint">&mdash;</span>
                            )}
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
