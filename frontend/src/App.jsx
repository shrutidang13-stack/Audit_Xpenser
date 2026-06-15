import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Clients } from "./pages/Clients";
import { Dashboard } from "./pages/Dashboard";
import { Mapping } from "./pages/Mapping";
import { Processing } from "./pages/Processing";
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
      { path: "client/:clientId/dashboard", element: <Dashboard /> },
      { path: "client/:clientId/bill-matching", element: <TablePage type="bill-matches" /> },
      { path: "client/:clientId/high-risk", element: <TablePage type="high-risk-expenses" /> },
      { path: "client/:clientId/statutory-alerts", element: <TablePage type="statutory-alerts" /> },
      { path: "client/:clientId/vendor-risks", element: <TablePage type="vendor-risks" /> },
      { path: "client/:clientId/capital-review", element: <TablePage type="capital-review" /> },
      { path: "client/:clientId/form3cd", element: <TablePage type="form3cd-impact" /> },
      { path: "client/:clientId/queries", element: <TablePage type="client-queries" /> },
      { path: "client/:clientId/working-paper", element: <WorkingPaper /> },
      { path: "client/:clientId/audit-trail", element: <TablePage type="audit-trail" /> }
    ]
  }
]);

export function App() {
  return <RouterProvider router={router} />;
}
