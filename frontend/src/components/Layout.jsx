import { BarChart3, ClipboardList, FileText, FolderUp, History, Landmark, LayoutDashboard, Scale, ShieldAlert, Users } from "lucide-react";
import { NavLink, Outlet, useParams } from "react-router-dom";

const navItems = [
  ["Upload Centre", "/", FolderUp],
  ["Clients", "/clients", Users],
  ["Mapping", "/mapping", ClipboardList],
  ["Processing", "/processing", Scale],
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Bill Matching", "/bill-matching", FileText],
  ["High Risk", "/high-risk", ShieldAlert],
  ["Statutory", "/statutory-alerts", Landmark],
  ["Vendor Risks", "/vendor-risks", Users],
  ["Capital Review", "/capital-review", BarChart3],
  ["Form 3CD", "/form3cd", ClipboardList],
  ["Queries", "/queries", FileText],
  ["Working Paper", "/working-paper", FileText],
  ["Audit Trail", "/audit-trail", History]
];

export function Layout() {
  const { clientId } = useParams();
  const activeClientId = clientId;
  const prefix = activeClientId ? `/client/${activeClientId}` : "";
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-ink/10 bg-white lg:block">
        <div className="border-b border-ink/10 px-5 py-5">
          <div className="text-xl font-black tracking-normal text-ink">AuditXpenser</div>
          <div className="mt-1 text-xs font-semibold uppercase text-teal">AI Expense Verification</div>
        </div>
        <nav className="h-[calc(100vh-82px)] overflow-y-auto p-3">
          {navItems.map(([label, path, Icon]) => {
            const isGlobal = path === "/" || path === "/clients";
            const to = isGlobal ? path : `${prefix}${path}`;
            const disabled = !isGlobal && !activeClientId;
            return (
              <NavLink key={label} to={disabled ? "/" : to} className={({ isActive }) => `mb-1 flex h-10 items-center gap-3 rounded px-3 text-sm font-semibold ${isActive ? "bg-moss text-white" : "text-ink/75 hover:bg-ink/5"} ${disabled ? "opacity-45" : ""}`}>
                <Icon size={17} />
                {label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
