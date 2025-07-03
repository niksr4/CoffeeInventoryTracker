"use client"

// Explicitly import the named export from accounts-page.tsx
// The component we want is exported as 'LaborDeploymentTab' (an alias for LaborSection)
import { LaborDeploymentTab as ActualLaborDeploymentTab } from "@/components/accounts-page"

// Export it as the default export.
// This ensures that components importing from "@/components/labor-deployment-tab"
// using `import LaborDeploymentTab from ...` continue to work.
export default ActualLaborDeploymentTab
