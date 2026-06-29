/**
 * Realistic enterprise mock data for UI development.
 * All data is structured to resemble production enterprise usage patterns.
 */

import type { User, Document, Conversation, Message } from "@/types";

// =============================================================================
// Mock Users
// =============================================================================

export const MOCK_USER: User = {
  id: "usr_01hwzqe8p3k4n5m6",
  email: "sarah.chen@acmecorp.com",
  full_name: "Sarah Chen",
  role: "admin",
  is_active: true,
  is_verified: true,
  avatar_url: null,
  department: "Engineering",
  job_title: "Head of AI Platform",
  created_at: "2024-01-15T09:00:00Z",
  updated_at: "2024-06-20T14:30:00Z",
};

export const MOCK_USERS: User[] = [
  MOCK_USER,
  {
    id: "usr_02hwzqe8p3k4n5m7",
    email: "marcus.lee@acmecorp.com",
    full_name: "Marcus Lee",
    role: "manager",
    is_active: true,
    is_verified: true,
    avatar_url: null,
    department: "Product",
    job_title: "Senior Product Manager",
    created_at: "2024-01-20T09:00:00Z",
    updated_at: "2024-06-18T11:00:00Z",
  },
  {
    id: "usr_03hwzqe8p3k4n5m8",
    email: "priya.patel@acmecorp.com",
    full_name: "Priya Patel",
    role: "analyst",
    is_active: true,
    is_verified: true,
    avatar_url: null,
    department: "Finance",
    job_title: "Data Analyst",
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-06-19T16:45:00Z",
  },
  {
    id: "usr_04hwzqe8p3k4n5m9",
    email: "jordan.kim@acmecorp.com",
    full_name: "Jordan Kim",
    role: "user",
    is_active: true,
    is_verified: false,
    avatar_url: null,
    department: "Legal",
    job_title: "Legal Counsel",
    created_at: "2024-02-10T09:00:00Z",
    updated_at: "2024-06-15T09:20:00Z",
  },
  {
    id: "usr_05hwzqe8p3k4n5ma",
    email: "alex.torres@acmecorp.com",
    full_name: "Alex Torres",
    role: "user",
    is_active: false,
    is_verified: true,
    avatar_url: null,
    department: "HR",
    job_title: "HR Business Partner",
    created_at: "2024-03-05T09:00:00Z",
    updated_at: "2024-05-28T10:00:00Z",
  },
  {
    id: "usr_06hwzqe8p3k4n5mb",
    email: "rachel.wong@acmecorp.com",
    full_name: "Rachel Wong",
    role: "analyst",
    is_active: true,
    is_verified: true,
    avatar_url: null,
    department: "Marketing",
    job_title: "Marketing Analyst",
    created_at: "2024-03-15T09:00:00Z",
    updated_at: "2024-06-21T08:30:00Z",
  },
];

// =============================================================================
// Mock Documents
// =============================================================================

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc_01hwzqe8p3k4n5m6",
    title: "Q2 2024 Financial Report",
    filename: "Q2_2024_Financial_Report.pdf",
    file_type: "pdf",
    file_size_bytes: 2457600,
    status: "indexed",
    chunk_count: 142,
    collection_name: "enterprise_knowledge",
    uploaded_by: "usr_01hwzqe8p3k4n5m6",
    description: "Comprehensive financial report covering Q2 2024 performance metrics and forecasts.",
    tags: ["finance", "quarterly", "2024"],
    created_at: "2024-06-20T10:30:00Z",
    updated_at: "2024-06-20T11:15:00Z",
  },
  {
    id: "doc_02hwzqe8p3k4n5m7",
    title: "Employee Handbook 2024",
    filename: "Employee_Handbook_2024.docx",
    file_type: "docx",
    file_size_bytes: 1843200,
    status: "indexed",
    chunk_count: 289,
    collection_name: "enterprise_knowledge",
    uploaded_by: "usr_02hwzqe8p3k4n5m7",
    description: "Complete employee handbook covering company policies, benefits, and culture.",
    tags: ["hr", "policy", "handbook"],
    created_at: "2024-06-18T14:00:00Z",
    updated_at: "2024-06-18T14:45:00Z",
  },
  {
    id: "doc_03hwzqe8p3k4n5m8",
    title: "Product Roadmap Q3-Q4 2024",
    filename: "Product_Roadmap_Q3Q4_2024.pdf",
    file_type: "pdf",
    file_size_bytes: 5242880,
    status: "indexed",
    chunk_count: 67,
    collection_name: "enterprise_knowledge",
    uploaded_by: "usr_03hwzqe8p3k4n5m8",
    description: "Strategic product roadmap outlining key initiatives for H2 2024.",
    tags: ["product", "roadmap", "strategy"],
    created_at: "2024-06-15T09:00:00Z",
    updated_at: "2024-06-15T09:30:00Z",
  },
  {
    id: "doc_04hwzqe8p3k4n5m9",
    title: "Security Compliance Framework",
    filename: "Security_Compliance_Framework_v2.pdf",
    file_type: "pdf",
    file_size_bytes: 3145728,
    status: "processing",
    chunk_count: 0,
    collection_name: "enterprise_knowledge",
    uploaded_by: "usr_01hwzqe8p3k4n5m6",
    description: "ISO 27001 compliance framework and security audit checklist.",
    tags: ["security", "compliance", "iso27001"],
    created_at: "2024-06-21T08:00:00Z",
    updated_at: "2024-06-21T08:05:00Z",
  },
  {
    id: "doc_05hwzqe8p3k4n5ma",
    title: "Technical Architecture v3",
    filename: "Technical_Architecture_v3.pdf",
    file_type: "pdf",
    file_size_bytes: 4194304,
    status: "indexed",
    chunk_count: 198,
    collection_name: "enterprise_knowledge",
    uploaded_by: "usr_04hwzqe8p3k4n5m9",
    description: "System architecture documentation for the core platform infrastructure.",
    tags: ["engineering", "architecture", "infrastructure"],
    created_at: "2024-06-12T11:30:00Z",
    updated_at: "2024-06-12T12:00:00Z",
  },
  {
    id: "doc_06hwzqe8p3k4n5mb",
    title: "Sales Playbook 2024",
    filename: "Sales_Playbook_2024.docx",
    file_type: "docx",
    file_size_bytes: 2097152,
    status: "indexed",
    chunk_count: 156,
    collection_name: "enterprise_knowledge",
    uploaded_by: "usr_06hwzqe8p3k4n5mb",
    description: "Complete sales methodology, qualification criteria, and closing techniques.",
    tags: ["sales", "playbook", "methodology"],
    created_at: "2024-06-10T15:00:00Z",
    updated_at: "2024-06-10T15:30:00Z",
  },
  {
    id: "doc_07hwzqe8p3k4n5mc",
    title: "Market Research Report — AI Tools",
    filename: "Market_Research_AI_Tools_2024.xlsx",
    file_type: "xlsx",
    file_size_bytes: 1048576,
    status: "indexed",
    chunk_count: 43,
    collection_name: "enterprise_knowledge",
    uploaded_by: "usr_03hwzqe8p3k4n5m8",
    description: "Competitive landscape analysis of enterprise AI tool market in 2024.",
    tags: ["research", "market", "ai", "competitive"],
    created_at: "2024-06-08T10:00:00Z",
    updated_at: "2024-06-08T10:20:00Z",
  },
  {
    id: "doc_08hwzqe8p3k4n5md",
    title: "Contract Template Library",
    filename: "Contract_Templates.docx",
    file_type: "docx",
    file_size_bytes: 786432,
    status: "failed",
    chunk_count: 0,
    collection_name: "enterprise_knowledge",
    uploaded_by: "usr_04hwzqe8p3k4n5m9",
    description: "Standard contract templates for vendor agreements and NDAs.",
    tags: ["legal", "contracts", "templates"],
    created_at: "2024-06-05T14:00:00Z",
    updated_at: "2024-06-05T14:10:00Z",
  },
];

// =============================================================================
// Mock Conversations
// =============================================================================

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_01hwzqe8p3k4n5m6",
    title: "Q2 Financial Risk Analysis",
    user_id: "usr_01hwzqe8p3k4n5m6",
    status: "active",
    total_tokens_used: 8420,
    model_used: "gpt-4o",
    created_at: "2024-06-21T09:15:00Z",
    updated_at: "2024-06-21T09:45:00Z",
  },
  {
    id: "conv_02hwzqe8p3k4n5m7",
    title: "Employee Benefits Summary",
    user_id: "usr_01hwzqe8p3k4n5m6",
    status: "active",
    total_tokens_used: 3240,
    model_used: "gpt-4o",
    created_at: "2024-06-20T14:30:00Z",
    updated_at: "2024-06-20T15:00:00Z",
  },
  {
    id: "conv_03hwzqe8p3k4n5m8",
    title: "Product Roadmap Q3 Priorities",
    user_id: "usr_01hwzqe8p3k4n5m6",
    status: "active",
    total_tokens_used: 5680,
    model_used: "gpt-4o",
    created_at: "2024-06-19T11:00:00Z",
    updated_at: "2024-06-19T11:30:00Z",
  },
  {
    id: "conv_04hwzqe8p3k4n5m9",
    title: "Security Audit Requirements",
    user_id: "usr_01hwzqe8p3k4n5m6",
    status: "archived",
    total_tokens_used: 2100,
    model_used: "gpt-4o",
    created_at: "2024-06-15T10:00:00Z",
    updated_at: "2024-06-15T10:20:00Z",
  },
  {
    id: "conv_05hwzqe8p3k4n5ma",
    title: "Sales Team Onboarding Process",
    user_id: "usr_01hwzqe8p3k4n5m6",
    status: "archived",
    total_tokens_used: 4890,
    model_used: "gpt-4o",
    created_at: "2024-06-12T16:00:00Z",
    updated_at: "2024-06-12T16:45:00Z",
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg_01hwzqe8p3k4n5m6",
    conversation_id: "conv_01hwzqe8p3k4n5m6",
    role: "user",
    content: "What are the key financial risks identified in the Q2 2024 report?",
    tokens_used: 18,
    sources: null,
    latency_ms: null,
    feedback: null,
    created_at: "2024-06-21T09:15:30Z",
  },
  {
    id: "msg_02hwzqe8p3k4n5m7",
    conversation_id: "conv_01hwzqe8p3k4n5m6",
    role: "assistant",
    content: `Based on the Q2 2024 Financial Report, the key financial risks identified are:

**1. Revenue Concentration Risk**
Approximately 42% of revenue is concentrated in the top 5 customers, creating significant exposure to churn or renegotiation pressure.

**2. Foreign Exchange Exposure**
With 31% of revenue generated in EUR and GBP, the company faces meaningful FX headwinds, particularly given recent USD strengthening. The report estimates a $2.4M potential impact if current trends persist through Q4.

**3. Operating Cost Inflation**
COGS increased 8.3% YoY, primarily driven by cloud infrastructure costs (+22%) and personnel expenses (+11%), outpacing revenue growth of 6.1%.

**4. Deferred Revenue Recognition Risk**
$14.2M in enterprise contracts have non-standard delivery milestones that may delay revenue recognition into Q1 2025.

**5. Liquidity Runway**
Current cash reserves provide an 18-month runway at the current burn rate, though the report recommends securing an additional credit facility as a contingency measure.`,
    tokens_used: 187,
    sources: [
      {
        document_id: "doc_01hwzqe8p3k4n5m6",
        document_title: "Q2 2024 Financial Report",
        chunk_index: 12,
        content_preview: "Revenue concentration analysis reveals top 5 customers account for 42.3% of total ARR...",
        similarity_score: 0.94,
      },
      {
        document_id: "doc_01hwzqe8p3k4n5m6",
        document_title: "Q2 2024 Financial Report",
        chunk_index: 28,
        content_preview: "FX exposure analysis: EUR/GBP denominated contracts represent 31% of total revenue...",
        similarity_score: 0.89,
      },
    ],
    latency_ms: 1842,
    feedback: "positive",
    created_at: "2024-06-21T09:17:12Z",
  },
  {
    id: "msg_03hwzqe8p3k4n5m8",
    conversation_id: "conv_01hwzqe8p3k4n5m6",
    role: "user",
    content: "What mitigation strategies does the report recommend for the revenue concentration risk?",
    tokens_used: 22,
    sources: null,
    latency_ms: null,
    feedback: null,
    created_at: "2024-06-21T09:20:00Z",
  },
  {
    id: "msg_04hwzqe8p3k4n5m9",
    conversation_id: "conv_01hwzqe8p3k4n5m6",
    role: "assistant",
    content: `The Q2 report outlines a three-pronged strategy for reducing revenue concentration risk:

**Immediate Actions (Q3 2024)**
- Accelerate mid-market expansion by increasing SMB sales headcount by 15 FTEs
- Introduce a new tier-based pricing model to improve SMB conversion rates
- Launch a customer success program targeting at-risk enterprise accounts

**Medium-Term Initiatives (Q4 2024 – Q1 2025)**
- Geographic expansion into APAC markets, targeting $8M in new ARR
- Product-led growth initiatives to reduce reliance on direct sales
- Partner channel development targeting 20% of new bookings via resellers

**Long-Term Strategy (2025+)**
- Build platform ecosystem to reduce switching costs and improve retention
- Diversify into two adjacent market segments identified in the Market Research Report

The CFO notes that the target is to reduce top-5 customer concentration to below 30% by end of FY2025.`,
    tokens_used: 168,
    sources: [
      {
        document_id: "doc_01hwzqe8p3k4n5m6",
        document_title: "Q2 2024 Financial Report",
        chunk_index: 45,
        content_preview: "Risk mitigation strategy: Revenue diversification roadmap targets reduction of concentration...",
        similarity_score: 0.92,
      },
    ],
    latency_ms: 1654,
    feedback: null,
    created_at: "2024-06-21T09:21:54Z",
  },
];

// =============================================================================
// Analytics Chart Data
// =============================================================================

export const CONVERSATION_TREND_DATA = [
  { date: "Jun 1", conversations: 38, messages: 156, tokens: 124000 },
  { date: "Jun 3", conversations: 45, messages: 189, tokens: 148000 },
  { date: "Jun 5", conversations: 52, messages: 214, tokens: 172000 },
  { date: "Jun 7", conversations: 41, messages: 170, tokens: 138000 },
  { date: "Jun 9", conversations: 67, messages: 278, tokens: 218000 },
  { date: "Jun 11", conversations: 58, messages: 241, tokens: 192000 },
  { date: "Jun 13", conversations: 74, messages: 305, tokens: 241000 },
  { date: "Jun 15", conversations: 83, messages: 342, tokens: 268000 },
  { date: "Jun 17", conversations: 71, messages: 293, tokens: 231000 },
  { date: "Jun 19", conversations: 89, messages: 367, tokens: 289000 },
  { date: "Jun 21", conversations: 94, messages: 388, tokens: 306000 },
  { date: "Jun 23", conversations: 102, messages: 421, tokens: 332000 },
  { date: "Jun 25", conversations: 88, messages: 363, tokens: 286000 },
  { date: "Jun 27", conversations: 97, messages: 401, tokens: 316000 },
];

export const DOCUMENT_TYPE_DATA = [
  { type: "PDF", count: 198, fill: "#4F46E5" },
  { type: "DOCX", count: 112, fill: "#6366F1" },
  { type: "TXT", count: 43, fill: "#06B6D4" },
  { type: "XLSX", count: 21, fill: "#10B981" },
  { type: "MD", count: 10, fill: "#F59E0B" },
];

export const DEPARTMENT_USAGE_DATA = [
  { department: "Engineering", queries: 842, tokens: 692000, cost: 27.68 },
  { department: "Product", queries: 621, tokens: 511000, cost: 20.44 },
  { department: "Finance", queries: 487, tokens: 401000, cost: 16.04 },
  { department: "Sales", queries: 398, tokens: 328000, cost: 13.12 },
  { department: "Legal", queries: 312, tokens: 257000, cost: 10.28 },
  { department: "HR", queries: 187, tokens: 154000, cost: 6.16 },
];

export const RESPONSE_TIME_DATA = [
  { date: "Jun 15", p50: 1.2, p95: 2.8, p99: 4.1 },
  { date: "Jun 16", p50: 1.1, p95: 2.6, p99: 3.9 },
  { date: "Jun 17", p50: 1.4, p95: 3.1, p99: 4.8 },
  { date: "Jun 18", p50: 1.0, p95: 2.4, p99: 3.6 },
  { date: "Jun 19", p50: 1.3, p95: 2.9, p99: 4.3 },
  { date: "Jun 20", p50: 1.1, p95: 2.5, p99: 3.7 },
  { date: "Jun 21", p50: 0.9, p95: 2.1, p99: 3.2 },
];

export const COST_DAILY_DATA = [
  { date: "Jun 1", cost: 8.42, tokens: 218000 },
  { date: "Jun 3", cost: 10.18, tokens: 264000 },
  { date: "Jun 5", cost: 12.84, tokens: 333000 },
  { date: "Jun 7", cost: 9.60, tokens: 249000 },
  { date: "Jun 9", cost: 15.32, tokens: 397000 },
  { date: "Jun 11", cost: 13.76, tokens: 357000 },
  { date: "Jun 13", cost: 17.28, tokens: 448000 },
  { date: "Jun 15", cost: 19.44, tokens: 504000 },
  { date: "Jun 17", cost: 16.08, tokens: 417000 },
  { date: "Jun 19", cost: 20.88, tokens: 541000 },
  { date: "Jun 21", cost: 22.16, tokens: 575000 },
];

export const SYSTEM_HEALTH_DATA = [
  { time: "14:00", cpu: 42, memory: 68, latency: 38 },
  { time: "14:10", cpu: 48, memory: 70, latency: 42 },
  { time: "14:20", cpu: 38, memory: 69, latency: 35 },
  { time: "14:30", cpu: 55, memory: 72, latency: 58 },
  { time: "14:40", cpu: 61, memory: 74, latency: 72 },
  { time: "14:50", cpu: 45, memory: 71, latency: 44 },
  { time: "15:00", cpu: 40, memory: 69, latency: 38 },
];

export const EVALUATION_HISTORY_DATA = [
  { id: "eval_001", date: "2024-06-21", dataset: "Finance Q&A", faithfulness: 96.4, relevance: 93.2, precision: 91.8, status: "passed" },
  { id: "eval_002", date: "2024-06-20", dataset: "HR Policies", faithfulness: 94.1, relevance: 91.5, precision: 89.4, status: "passed" },
  { id: "eval_003", date: "2024-06-19", dataset: "Technical Docs", faithfulness: 88.7, relevance: 85.3, precision: 84.1, status: "warning" },
  { id: "eval_004", date: "2024-06-18", dataset: "Legal Contracts", faithfulness: 97.2, relevance: 94.8, precision: 93.6, status: "passed" },
  { id: "eval_005", date: "2024-06-17", dataset: "Product Specs", faithfulness: 79.4, relevance: 76.2, precision: 74.8, status: "failed" },
  { id: "eval_006", date: "2024-06-16", dataset: "Finance Q&A", faithfulness: 95.8, relevance: 92.4, precision: 90.9, status: "passed" },
];

export const GUARDRAIL_EVENTS_DATA = [
  { category: "Prompt Injection", blocked: 47, detected: 52, date: "Jun 21" },
  { category: "PII Detection", blocked: 23, detected: 31, date: "Jun 21" },
  { category: "Harmful Content", blocked: 12, detected: 12, date: "Jun 21" },
  { category: "Topic Scope", blocked: 89, detected: 103, date: "Jun 21" },
  { category: "Token Limit", blocked: 34, detected: 34, date: "Jun 21" },
];

// =============================================================================
// Notifications Mock Data
// =============================================================================

export interface MockNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  read: boolean;
  created_at: string;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "notif_001",
    type: "success",
    title: "Document indexed successfully",
    description: "Security Compliance Framework v2 has been processed and indexed.",
    read: false,
    created_at: "2024-06-21T08:15:00Z",
  },
  {
    id: "notif_002",
    type: "warning",
    title: "High token usage detected",
    description: "Engineering department has used 82% of the monthly token budget.",
    read: false,
    created_at: "2024-06-21T07:30:00Z",
  },
  {
    id: "notif_003",
    type: "error",
    title: "Document processing failed",
    description: "Contract Template Library could not be parsed. Please re-upload.",
    read: false,
    created_at: "2024-06-20T16:45:00Z",
  },
  {
    id: "notif_004",
    type: "info",
    title: "New user joined",
    description: "Rachel Wong (Marketing) has created an account and is awaiting approval.",
    read: true,
    created_at: "2024-06-20T14:20:00Z",
  },
  {
    id: "notif_005",
    type: "info",
    title: "Monthly evaluation report ready",
    description: "June 2024 AI evaluation report is available for review.",
    read: true,
    created_at: "2024-06-20T09:00:00Z",
  },
];

// =============================================================================
// Suggested Prompts
// =============================================================================

export const SUGGESTED_PROMPTS = [
  {
    category: "Finance",
    icon: "💰",
    prompts: [
      "What are the key financial risks in the Q2 2024 report?",
      "Summarize revenue performance for Q2 2024",
      "What is the current cash runway and burn rate?",
    ],
  },
  {
    category: "HR & People",
    icon: "👥",
    prompts: [
      "What is the parental leave policy according to the employee handbook?",
      "How does the performance review process work?",
      "What benefits are available for remote employees?",
    ],
  },
  {
    category: "Product",
    icon: "🚀",
    prompts: [
      "What are the top product priorities for Q3 2024?",
      "Which features are scheduled for the next release?",
      "What customer problems does the roadmap address?",
    ],
  },
  {
    category: "Legal",
    icon: "⚖️",
    prompts: [
      "What are the key clauses in the standard vendor NDA?",
      "What compliance requirements apply to our data handling?",
      "Summarize the IP assignment terms in contractor agreements",
    ],
  },
];
