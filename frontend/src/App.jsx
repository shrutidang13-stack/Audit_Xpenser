import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuditDashboard } from "./pages/AuditDashboard";
import { AuditWorksheet } from "./pages/AuditWorksheet";
import { ClientQueries } from "./pages/ClientQueries";
import { Clients } from "./pages/Clients";
import { Dashboard } from "./pages/Dashboard";
import { Exceptions } from "./pages/Exceptions";
import { Mapping } from "./pages/Mapping";
import { Processing } from "./pages/Processing";
import { ReferenceLibrary } from "./pages/ReferenceLibrary";
import { TablePage } from "./pages/TablePage";
import { UploadCentre } from "./pages/UploadCentre";
import { WorkingPaper } from "./pages/WorkingPaper";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <UploadCentre /> },
      { path: "clients", element: <Clients /> },
      { path: "client/:clientId/upload", element: <UploadCentre /> },
      { path: "client/:clientId/mapping", element: <Mapping /> },
      { path: "client/:clientId/processing", element: <Processing /> },
      { path: "client/:clientId/audit-worksheet", element: <AuditWorksheet /> },
      { path: "client/:clientId/audited-data", element: <AuditWorksheet /> },
      { path: "client/:clientId/audit-dashboard", element: <AuditDashboard /> },
      { path: "client/:clientId/rules", element: <ReferenceLibrary /> },
      { path: "client/:clientId/reference-library", element: <ReferenceLibrary /> },
      { path: "client/:clientId/exceptions", element: <Exceptions /> },
      { path: "client/:clientId/dashboard", element: <Dashboard /> },
      { path: "client/:clientId/bill-matching", element: <TablePage type="bill-matches" /> },
      { path: "client/:clientId/high-risk", element: <TablePage type="high-risk-expenses" /> },
      { path: "client/:clientId/statutory-alerts", element: <TablePage type="statutory-alerts" /> },
      { path: "client/:clientId/vendor-risks", element: <TablePage type="vendor-risks" /> },
      { path: "client/:clientId/capital-review", element: <TablePage type="capital-review" /> },
      { path: "client/:clientId/form3cd", element: <TablePage type="form3cd-impact" /> },
      { path: "client/:clientId/queries", element: <ClientQueries /> },
      { path: "client/:clientId/working-paper", element: <WorkingPaper /> },
      { path: "client/:clientId/audit-trail", element: <TablePage type="audit-trail" /> }
    ]
  }
]);

export function App() {
  return <RouterProvider router={router} />;
}
