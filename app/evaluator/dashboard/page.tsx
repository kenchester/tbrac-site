"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  LogOut,
  TrendingUp,
} from "lucide-react";
import type { Submission } from "@/lib/evaluator-types";

function DashboardContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const evaluatorName = user?.email?.split("@")[0] || "Evaluator";

  useEffect(() => {
    // Load submissions (in production, this would come from a backend)
    loadSubmissions();
  }, []);

  const loadSubmissions = () => {
    const daysAgo = (d: number) =>
      new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

    const evaluators = [evaluatorName, "James Liu", "Sarah Chen", "Michael Park", "Emily Wang"];

    const mockData: Submission[] = [
      { id: "SUB-001", status: "approved",       submittedAt: daysAgo(2),  assignedEvaluator: evaluators[0], certificateIssued: true,  finalScore: 60, companyInfo: { companyName: "NovaTech Solutions Ltd.",            countryOfOrigin: "China", industry: "Technology",          contactName: "Lin Wei"     }, responses: {}, result: { overallScore: 60, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(1)  },
      { id: "SUB-002", status: "approved",       submittedAt: daysAgo(3),  assignedEvaluator: evaluators[1], certificateIssued: true,  finalScore: 59, companyInfo: { companyName: "Sino-Pacific Semiconductor Corp.",   countryOfOrigin: "China", industry: "Semiconductors",      contactName: "Zhang Hao"   }, responses: {}, result: { overallScore: 59, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(2)  },
      { id: "SUB-003", status: "approved",       submittedAt: daysAgo(4),  assignedEvaluator: evaluators[2], certificateIssued: true,  finalScore: 64, companyInfo: { companyName: "Eastern Shield Cybersecurity Inc.",  countryOfOrigin: "China", industry: "Technology",          contactName: "Chen Fang"   }, responses: {}, result: { overallScore: 64, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(3)  },
      { id: "SUB-004", status: "approved",       submittedAt: daysAgo(5),  assignedEvaluator: evaluators[3], certificateIssued: true,  finalScore: 74, companyInfo: { companyName: "Huang River Energy Group",           countryOfOrigin: "China", industry: "Energy",              contactName: "Wang Peng"   }, responses: {}, result: { overallScore: 74, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(4)  },
      { id: "SUB-005", status: "approved",       submittedAt: daysAgo(6),  assignedEvaluator: evaluators[4], certificateIssued: true,  finalScore: 71, companyInfo: { companyName: "Bright Future Consumer Electronics", countryOfOrigin: "China", industry: "Consumer Goods",      contactName: "Liu Ying"    }, responses: {}, result: { overallScore: 71, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(5)  },
      { id: "SUB-006", status: "approved",       submittedAt: daysAgo(7),  assignedEvaluator: evaluators[0], certificateIssued: true,  finalScore: 73, companyInfo: { companyName: "Dragon Gate Financial Holdings",     countryOfOrigin: "China", industry: "Financial Services",  contactName: "Zhao Min"    }, responses: {}, result: { overallScore: 73, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(6)  },
      { id: "SUB-007", status: "approved",       submittedAt: daysAgo(9),  assignedEvaluator: evaluators[1], certificateIssued: true,  finalScore: 64, companyInfo: { companyName: "Precision Robotics Manufacturing Co.", countryOfOrigin: "China", industry: "Manufacturing",       contactName: "Sun Lei"     }, responses: {}, result: { overallScore: 64, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(8)  },
      { id: "SUB-008", status: "approved",       submittedAt: daysAgo(10), assignedEvaluator: evaluators[2], certificateIssued: true,  finalScore: 75, companyInfo: { companyName: "MedCore Biotech Group",               countryOfOrigin: "China", industry: "Healthcare",          contactName: "Li Jing"     }, responses: {}, result: { overallScore: 75, overallRiskLevel: "low",    categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(9)  },
      { id: "SUB-009", status: "approved",       submittedAt: daysAgo(11), assignedEvaluator: evaluators[3], certificateIssued: true,  finalScore: 51, companyInfo: { companyName: "TransAsia Telecommunications Ltd.",  countryOfOrigin: "China", industry: "Telecommunications", contactName: "Xu Feng"     }, responses: {}, result: { overallScore: 51, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(10) },
      { id: "SUB-010", status: "approved",       submittedAt: daysAgo(13), assignedEvaluator: evaluators[4], certificateIssued: true,  finalScore: 71, companyInfo: { companyName: "Greenfield Agricultural Exports",    countryOfOrigin: "China", industry: "Agriculture",         contactName: "Gao Rui"     }, responses: {}, result: { overallScore: 71, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(12) },
      { id: "SUB-011", status: "approved",       submittedAt: daysAgo(14), assignedEvaluator: evaluators[0], certificateIssued: true,  finalScore: 58, companyInfo: { companyName: "Summit Cloud Technologies",          countryOfOrigin: "China", industry: "Technology",          contactName: "He Ling"     }, responses: {}, result: { overallScore: 58, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(13) },
      { id: "SUB-012", status: "under_review",   submittedAt: daysAgo(15), assignedEvaluator: evaluators[1],                           companyInfo: { companyName: "Pacific Rim Retail Group",           countryOfOrigin: "China", industry: "Retail",              contactName: "Tang Bo"     }, responses: {}, result: { overallScore: 71, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(14) },
      { id: "SUB-013", status: "under_review",   submittedAt: daysAgo(16), assignedEvaluator: evaluators[2],                           companyInfo: { companyName: "Yangtze Capital Ventures",           countryOfOrigin: "China", industry: "Financial Services",  contactName: "Jiang Mei"   }, responses: {}, result: { overallScore: 55, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(15) },
      { id: "SUB-014", status: "under_review",   submittedAt: daysAgo(17), assignedEvaluator: evaluators[3],                           companyInfo: { companyName: "Qingdao Smart Manufacturing",        countryOfOrigin: "China", industry: "Manufacturing",       contactName: "Luo Jian"    }, responses: {}, result: { overallScore: 55, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(16) },
      { id: "SUB-015", status: "under_review",   submittedAt: daysAgo(18), assignedEvaluator: evaluators[4],                           companyInfo: { companyName: "BioHorizons Pharmaceuticals",        countryOfOrigin: "China", industry: "Healthcare",          contactName: "Peng Xia"    }, responses: {}, result: { overallScore: 65, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(17) },
      { id: "SUB-016", status: "under_review",   submittedAt: daysAgo(19), assignedEvaluator: evaluators[0],                           companyInfo: { companyName: "Chengdu Aerospace Systems",          countryOfOrigin: "China", industry: "Defense",             contactName: "Cai Long"    }, responses: {}, result: { overallScore: 40, overallRiskLevel: "high",   categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(18) },
      { id: "SUB-017", status: "under_review",   submittedAt: daysAgo(20), assignedEvaluator: evaluators[1],                           companyInfo: { companyName: "IntelliDrive Automotive AI",         countryOfOrigin: "China", industry: "Technology",          contactName: "Deng Hui"    }, responses: {}, result: { overallScore: 69, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(19) },
      { id: "SUB-018", status: "under_review",   submittedAt: daysAgo(21), assignedEvaluator: evaluators[2],                           companyInfo: { companyName: "Coastal Clean Energy Corp.",         countryOfOrigin: "China", industry: "Energy",              contactName: "Fang Yu"     }, responses: {}, result: { overallScore: 50, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(20) },
      { id: "SUB-019", status: "under_review",   submittedAt: daysAgo(22), assignedEvaluator: evaluators[3],                           companyInfo: { companyName: "ShenzhenConnect Fiber Networks",     countryOfOrigin: "China", industry: "Telecommunications", contactName: "Gu Tao"      }, responses: {}, result: { overallScore: 53, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(21) },
      { id: "SUB-020", status: "under_review",   submittedAt: daysAgo(23), assignedEvaluator: evaluators[4],                           companyInfo: { companyName: "Harmony Consumer Brands",            countryOfOrigin: "China", industry: "Consumer Goods",      contactName: "Hou Nan"     }, responses: {}, result: { overallScore: 68, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(22) },
      { id: "SUB-021", status: "pending_review", submittedAt: daysAgo(24),                                                              companyInfo: { companyName: "Quantum Materials Science Ltd.",    countryOfOrigin: "China", industry: "Semiconductors",      contactName: "Jin Kai"     }, responses: {}, result: { overallScore: 53, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(24) },
      { id: "SUB-022", status: "pending_review", submittedAt: daysAgo(25),                                                              companyInfo: { companyName: "Northern Star Trade Finance",       countryOfOrigin: "China", industry: "Financial Services",  contactName: "Kong Wei"    }, responses: {}, result: { overallScore: 47, overallRiskLevel: "high",   categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(25) },
      { id: "SUB-023", status: "pending_review", submittedAt: daysAgo(26),                                                              companyInfo: { companyName: "SinoMed Healthcare Solutions",      countryOfOrigin: "China", industry: "Healthcare",          contactName: "Liang Hua"   }, responses: {}, result: { overallScore: 53, overallRiskLevel: "medium", categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(26) },
      { id: "SUB-024", status: "pending_review", submittedAt: daysAgo(28),                                                              companyInfo: { companyName: "Future Grid Power Systems",         countryOfOrigin: "China", industry: "Energy",              contactName: "Mao Zhen"    }, responses: {}, result: { overallScore: 28, overallRiskLevel: "high",   categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(28) },
      { id: "SUB-025", status: "pending_review", submittedAt: daysAgo(30),                                                              companyInfo: { companyName: "Nexus Digital Commerce Group",     countryOfOrigin: "China", industry: "Retail",              contactName: "Ni Jing"     }, responses: {}, result: { overallScore: 13, overallRiskLevel: "high",   categoryScores: [], completionPercentage: 100, recommendations: [], strengths: [], concerns: [] }, lastUpdated: daysAgo(30) },
    ];

    setSubmissions(mockData);
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending Review
          </Badge>
        );
      case "under_review":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Under Review
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Approved
          </Badge>
        );
      case "changes_requested":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            Changes Requested
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.companyInfo.companyName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending")
      return matchesSearch && sub.status === "pending_review";
    if (activeTab === "reviewing")
      return matchesSearch && sub.status === "under_review";
    if (activeTab === "completed")
      return (
        matchesSearch &&
        (sub.status === "approved" || sub.status === "completed")
      );
    return matchesSearch;
  });

  const stats = {
    pending: submissions.filter((s) => s.status === "pending_review").length,
    underReview: submissions.filter((s) => s.status === "under_review").length,
    approved: submissions.filter(
      (s) => s.status === "approved" || s.status === "completed",
    ).length,
    total: submissions.length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Evaluator Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {evaluatorName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/evaluator/engagements")}>Independent assessments</Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            The submissions below are sample data. Paid independent assessments are run under{" "}
            <button type="button" className="font-medium underline" onClick={() => router.push("/evaluator/engagements")}>
              Independent assessments
            </button>.
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pending Review
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats.pending}
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Under Review
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats.underReview}
                    </p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats.approved}
                    </p>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Submissions
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats.total}
                    </p>
                  </div>
                  <FileText className="h-10 w-10 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Assessment Submissions</CardTitle>
                  <CardDescription>
                    Review and manage TBRAC assessment submissions
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-[300px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">
                    All ({submissions.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending ({stats.pending})
                  </TabsTrigger>
                  <TabsTrigger value="reviewing">
                    Reviewing ({stats.underReview})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({stats.approved})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Evaluator</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubmissions.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center py-12 text-muted-foreground"
                            >
                              No submissions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSubmissions.map((submission) => (
                            <TableRow key={submission.id}>
                              <TableCell className="font-mono text-sm">
                                {submission.id}
                              </TableCell>
                              <TableCell className="font-medium">
                                {submission.companyInfo.companyName}
                              </TableCell>
                              <TableCell>
                                {submission.companyInfo.countryOfOrigin}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {Math.round(submission.result.overallScore)}
                                  </span>
                                  <TrendingUp
                                    className={`h-4 w-4 ${submission.result.overallScore >= 75 ? "text-green-500" : submission.result.overallScore >= 50 ? "text-yellow-500" : "text-red-500"}`}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(submission.status)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(
                                  submission.submittedAt,
                                ).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-sm">
                                {submission.assignedEvaluator || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(
                                      `/evaluator/review/${submission.id}`,
                                    )
                                  }
                                >
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function EvaluatorDashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
