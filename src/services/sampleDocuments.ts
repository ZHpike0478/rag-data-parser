import { RagDocument } from '../types/rag';

export interface SampleDocDef {
  id: string;
  name: string;
  type: RagDocument['type'];
  extension: string;
  description: string;
  icon: string;
  rawContent: string;
}

export const SAMPLE_DOCUMENTS: SampleDocDef[] = [
  {
    id: 'sample-api-guide',
    name: 'vectorflow_api_v2_spec.md',
    type: 'markdown',
    extension: 'md',
    description: 'Developer documentation with Markdown headers, code blocks, endpoints & rate limits',
    icon: 'code',
    rawContent: `# VectorFlow API v2 Reference Manual

## 1. Overview & Architecture
VectorFlow is a high-performance vector search and semantic indexing platform designed for enterprise RAG applications. It supports billion-scale vector indices with sub-5ms cosine and dot-product query latencies.

All API requests must be communicated over TLS 1.3 using standard JSON payloads. The base endpoint URL is:
\`\`\`bash
https://api.vectorflow.ai/v2
\`\`\`

## 2. Authentication & Security
All endpoints require authentication using a Bearer token passed in the \`Authorization\` HTTP header.

\`\`\`bash
curl -X GET https://api.vectorflow.ai/v2/indices \\
  -H "Authorization: Bearer vf_live_98a72b14c3e890f" \\
  -H "Content-Type: application/json"
\`\`\`

### 2.1 API Key Permissions
API keys can be scoped with fine-grained role-based access control (RBAC):
- \`index:read\`: Query vector collections and inspect collection statistics.
- \`index:write\`: Upsert embeddings, batch delete vectors, and mutate metadata.
- \`admin\`: Manage team keys, audit logging, and billing subscriptions.

### 2.2 IP Whitelisting
Production organizations can restrict API token access to dedicated corporate CIDR IP blocks such as \`192.168.1.0/24\` through the Security settings dashboard.

## 3. Vector Ingestion & Upsert
To insert high-dimensional embeddings into an index, execute a \`POST /indices/{index_id}/upsert\` request.

\`\`\`python
import requests

payload = {
    "vectors": [
        {
            "id": "doc_chunk_104",
            "values": [0.024, -0.412, 0.891, 0.115],
            "metadata": {
                "source": "financial_filing_2024.pdf",
                "page": 14,
                "category": "quarterly_earnings"
            }
        }
    ]
}

response = requests.post(
    "https://api.vectorflow.ai/v2/indices/idx_rag_prod/upsert",
    headers={"Authorization": "Bearer vf_live_secret"},
    json=payload
)
\`\`\`

## 4. Rate Limits & Quotas
- Free Tier: 60 requests per minute, 50,000 vectors max.
- Enterprise Tier: 10,000 requests per minute with guaranteed 99.99% uptime SLA.
When rate limits are exceeded, the API returns HTTP status code \`429 Too Many Requests\` with a \`Retry-After\` header indicating seconds to wait.`
  },

  {
    id: 'sample-legal-sla',
    name: 'enterprise_cloud_sla_agreement.pdf',
    type: 'pdf',
    extension: 'pdf',
    description: 'Enterprise Cloud Service Level Agreement with uptime commitments & penalty credits',
    icon: 'file-text',
    rawContent: `--- Page 1 ---
ENTERPRISE CLOUD SERVICE LEVEL AGREEMENT (SLA)
Document Revision: 2024.4 | Effective Date: November 1, 2024

SECTION 1: DEFINITIONS AND SERVICE COMMITMENT
This Service Level Agreement governs the operational availability and performance metrics of the Cloud Infrastructure Platform provided to the Customer.
"Monthly Uptime Percentage" is calculated by subtracting from 100% the percentage of minutes during any calendar month in which the Platform was in a state of "Unscheduled Downtime".

1.1 Uptime Commitment:
Provider guarantees a Monthly Uptime Percentage of at least 99.95% during any calendar billing month for all Multi-Region instances.

1.2 Scheduled Maintenance:
Routine maintenance windows shall occur exclusively on Sundays between 02:00 UTC and 04:00 UTC. Provider will deliver at least forty-eight (48) hours advance notice via system status dashboard for critical security patches.

--- Page 2 ---
SECTION 2: SERVICE CREDITS AND REMEDIES
If Provider fails to achieve the guaranteed Monthly Uptime Percentage, Customer will be eligible to receive a financial Service Credit applied against subsequent monthly invoices:

- Monthly Uptime 99.0% to < 99.95%: 10% Service Credit
- Monthly Uptime 95.0% to < 99.0%: 25% Service Credit
- Monthly Uptime < 95.0%: 50% Service Credit

2.1 Claims Process:
To receive a Service Credit, Customer must submit a formal ticket to support@cloudplatform.com within thirty (30) days of the incident containing timestamped logs, correlation IDs, and traceroute outputs.

--- Page 3 ---
SECTION 3: DATA PRIVACY & COMPLIANCE
All Customer customer data stored within the storage cluster is encrypted at rest using AES-256 GCM and in transit via TLS 1.3.
Compliance Standards:
- SOC 2 Type II certified annually by third-party auditors.
- ISO/IEC 27001:2022 Information Security Management System compliant.
- HIPAA Business Associate Agreement (BAA) available upon contract execution.
For security incident reporting, please contact compliance-officer@cloudplatform.com or call our 24/7 hotline at (800) 555-0199.`
  },

  {
    id: 'sample-products-csv',
    name: 'product_support_knowledgebase.csv',
    type: 'csv',
    extension: 'csv',
    description: 'Structured CSV tabular dataset with product specifications, troubleshooting & warranties',
    icon: 'table',
    rawContent: `# Dataset: product_support_knowledgebase.csv
Columns: SKU, ProductName, Category, WarrantyMonths, CommonIssue, ResolutionInstructions

[Record #1]
SKU: AP-PRO-X1 | ProductName: Apex Wireless Headphones Pro | Category: Audio | WarrantyMonths: 24 | CommonIssue: Bluetooth pairing drops intermittently | ResolutionInstructions: Hold Power and Volume Up buttons simultaneously for 10 seconds until the LED flashes purple to perform a hardware factory reset. Ensure Bluetooth 5.3 firmware v2.1.4 is installed via the Apex Companion App.

[Record #2]
SKU: AP-AIR-7 | ProductName: Apex Ultra Air Earbuds | Category: Audio | WarrantyMonths: 12 | CommonIssue: Low audio volume in left earbud | ResolutionInstructions: Clean silicone acoustic mesh with 70% isopropyl alcohol and cotton swab. Calibrate ear canal seal in mobile app settings under Audio Balance.

[Record #3]
SKU: CAM-4K-ULTRA | ProductName: VisionStream 4K Webcam | Category: Video | WarrantyMonths: 36 | CommonIssue: Flickering video on 60Hz artificial lighting | ResolutionInstructions: Navigate to Camera Properties > Advanced Video Settings > Anti-Flicker. Switch frequency from 50Hz to 60Hz. Ensure USB 3.2 Gen 2 cable is plugged directly into motherboard root hub without passive USB hub.

[Record #4]
SKU: DOCK-TB4-PRO | ProductName: Titan Thunderbolt 4 Dual 4K Dock | Category: Accessories | WarrantyMonths: 24 | CommonIssue: External monitor not detected on Apple M2/M3 laptops | ResolutionInstructions: Connect the 100W PD host cable to the primary Thunderbolt port with lightning bolt emblem. Enable "Allow accessory to connect" in macOS System Settings > Privacy & Security.`
  },

  {
    id: 'sample-ai-paper',
    name: 'optimizing_chunk_sizes_in_rag.txt',
    type: 'text',
    extension: 'txt',
    description: 'Academic paper discussing dense vs hybrid retrieval, context fragmentation & token windows',
    icon: 'book-open',
    rawContent: `OPTIMIZING CHUNK SIZES AND CONTEXT BOUNDARIES IN RETRIEVAL-AUGMENTED GENERATION
Authors: Dr. Elena Vance, Marcus Thorne
Department of Computer Science & Artificial Intelligence Laboratory

ABSTRACT
Retrieval-Augmented Generation (RAG) relies on decomposing large document corpora into discrete, searchable segments termed "chunks". Despite widespread adoption, naive fixed-size chunking frequently suffers from context fragmentation—where critical semantic units are bisected across arbitrary token boundaries—or context dilution, where oversized chunks degrade embedding specificity. In this empirical study, we evaluate recursive character splitting, markdown semantic boundaries, and contextual prefix injection across 15,000 domain-specific queries.

1. INTRODUCTION & PROBLEM FORMULATION
Standard dense retrieval models map a passage P into a fixed-length embedding vector v = f(P). When a user poses a question Q, the top-k nearest neighbors are identified using cosine distance.
However, if chunk size C is too small (e.g., C < 150 characters), the passage lacks relational context, leading to high false-positive retrieval. Conversely, when C > 2000 characters, the dense vector averages out granular entity mentions, reducing top-1 recall by 28.4%.

2. CONTEXTUAL RETRIEVAL & PREFIX INJECTION
Our proposed technique prepends a synthesized contextual breadcrumb to each chunk prior to vector computation:
Example: "[Document: annual_report.pdf | Section: Risk Factors > Inflation]"
Experimental results demonstrate that contextual prefixing increases retrieval recall at K=3 from 62.1% to 84.7% without requiring model fine-tuning.

3. OVERLAP OPTIMIZATION
We found that a sliding overlap of 15% to 20% of the total chunk size provides the optimal tradeoff between redundancy and boundary continuity. Overlaps exceeding 35% generate redundant duplicate candidates that waste limited LLM input context tokens.`
  }
];
