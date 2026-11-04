"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { PortalHeader } from "@/components/portal-header";
import {
  useCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/use-customers";
import { useCustomerDocuments } from "@/hooks/use-documents";
import { useCustomerAssessments } from "@/hooks/use-assessments";
import { useApiToast } from "@/hooks/use-api-toast";
import {
  IndustrySector,
  OwnershipType,
  type CustomerUpdate,
} from "@/lib/api-types";
import {
  formatIndustrySector,
  formatOwnershipType,
  formatDocumentType,
  formatProcessingStatus,
  formatFileSize,
  formatDate,
} from "@/lib/format-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Building2,
  Globe,
  MapPin,
  Save,
  ClipboardList,
  Plus,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { documentRequestsApi, needsResponse } from "@/lib/document-requests";
import { RequestAssessmentCard } from "@/components/request-assessment-card";

interface PageProps {
  params: Promise<{ id: string }>;
}

function CustomerDetailContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: customer, loading, error, refetch } = useCustomer(
    resolvedParams.id,
  );
  const { data: documents } = useCustomerDocuments(resolvedParams.id, {
    page: 1,
    pageSize: 5,
  });
  const { data: assessments } = useCustomerAssessments(resolvedParams.id, {
    page: 1,
    pageSize: 5,
  });
  const { update, loading: updating } = useUpdateCustomer();
  const { deleteCustomer, loading: deleting } = useDeleteCustomer();
  const { handleError, showSuccess } = useApiToast();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<{ total: number; open: number } | null>(null);
  useEffect(() => {
    documentRequestsApi.list(resolvedParams.id).then((d) => {
      const all = d.engagements.filter((e) => !e.closed).flatMap((e) => e.requests);
      setRequests({ total: all.length, open: all.filter(needsResponse).length });
    }).catch(() => setRequests(null));
  }, [resolvedParams.id]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerUpdate>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (customer && editDialogOpen) {
      setFormData({
        name: customer.name,
        chinese_name: customer.chinese_name,
        industry_sector: customer.industry_sector,
        ownership_type: customer.ownership_type,
        state_ownership_percentage: customer.state_ownership_percentage,
        headquarters_country: customer.headquarters_country,
        headquarters_city: customer.headquarters_city,
        us_presence: customer.us_presence,
        us_subsidiary_name: customer.us_subsidiary_name,
        website: customer.website,
        notes: customer.notes,
      });
      setValidationErrors({});
    }
  }, [customer, editDialogOpen]);

  const validateEdit = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      errors.name = "Company name is required";
    }

    if (
      formData.headquarters_country !== undefined &&
      !formData.headquarters_country.trim()
    ) {
      errors.headquarters_country = "Headquarters country is required";
    }

    if (
      formData.state_ownership_percentage !== undefined &&
      formData.state_ownership_percentage !== null
    ) {
      const percentage = Number(formData.state_ownership_percentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        errors.state_ownership_percentage = "Must be between 0 and 100";
      }
    }


    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateEdit()) return;

    try {
      const cleanedData: CustomerUpdate = { ...formData };
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key as keyof CustomerUpdate] === "") {
          delete cleanedData[key as keyof CustomerUpdate];
        }
      });

      await update(resolvedParams.id, cleanedData);
      showSuccess(t("customerUpdatedSuccess"));
      setEditDialogOpen(false);
      refetch();
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(resolvedParams.id);
      showSuccess(t("customerDeletedSuccess"));
      router.push("/customers");
    } catch (err) {
      handleError(err);
    }
  };

  const updateField = (field: keyof CustomerUpdate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const showStateOwnership =
    formData.ownership_type === OwnershipType.STATE_OWNED ||
    formData.ownership_type === OwnershipType.MIXED;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PortalHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-8 w-[200px]" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[300px]" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-background">
        <PortalHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-red-600">
                {t("customerNotFound")}
              </h2>
              <p className="mt-2 text-muted-foreground">{error}</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/customers")}
              >
                {t("customerBackToList")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/company/profile")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{customer.name}</h1>
                {customer.chinese_name && (
                  <p className="text-lg text-muted-foreground mt-1">
                    {customer.chinese_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                {t("customerEdit")}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("customerDelete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("customerDeleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {customer.name} and all
                      associated data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("customerDeleteCancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? t("customerDeleting") : t("customerDelete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Customer Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("customerInfoCard")}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {formatIndustrySector(customer.industry_sector)}
                  </Badge>
                  <Badge variant="secondary">
                    {formatOwnershipType(customer.ownership_type)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label className="text-muted-foreground">{t("customerCompanyName")}</Label>
                  <p className="font-medium mt-1">{customer.name}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    {t("customerIndustry")}
                  </Label>
                  <p className="font-medium mt-1">
                    {formatIndustrySector(customer.industry_sector)}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    {t("customerOwnership")}
                  </Label>
                  <p className="font-medium mt-1">
                    {formatOwnershipType(customer.ownership_type)}
                  </p>
                </div>

                {customer.state_ownership_percentage !== undefined &&
                  customer.state_ownership_percentage !== null && (
                    <div>
                      <Label className="text-muted-foreground">
                        {t("customerStateOwnership")}
                      </Label>
                      <p className="font-medium mt-1">
                        {customer.state_ownership_percentage}%
                      </p>
                    </div>
                  )}

                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {t("customerHQ")}
                  </Label>
                  <p className="font-medium mt-1">
                    {customer.headquarters_country}
                    {customer.headquarters_city &&
                      `, ${customer.headquarters_city}`}
                  </p>
                </div>

                {customer.us_presence && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label className="text-muted-foreground">{t("customerUSPresence")}</Label>
                    <p className="font-medium mt-1">{customer.us_presence}</p>
                  </div>
                )}

                {customer.us_subsidiary_name && (
                  <div>
                    <Label className="text-muted-foreground">
                      {t("customerUSSubsidiary")}
                    </Label>
                    <p className="font-medium mt-1">
                      {customer.us_subsidiary_name}
                    </p>
                  </div>
                )}

                {customer.website && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {t("customerWebsite")}
                    </Label>
                    <a
                      href={customer.website.match(/^https?:\/\//) ? customer.website : `https://${customer.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium mt-1 text-primary hover:underline flex items-center gap-1"
                    >
                      {customer.website}
                    </a>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">{t("customerCreated")}</Label>
                  <p className="font-medium mt-1">
                    {formatDate(customer.created_at)}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">{t("customerUpdated")}</Label>
                  <p className="font-medium mt-1">
                    {formatDate(customer.updated_at)}
                  </p>
                </div>
              </div>

              {customer.notes && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <Label className="text-muted-foreground">{t("customerNotes")}</Label>
                    <p className="mt-2 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {requests && requests.total > 0 && (
            <Card className={requests.open ? "border-amber-300" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{t("drDashCard")}</CardTitle>
                    <CardDescription>
                      {requests.open ? `${requests.open} ${t("drDashOpen")}` : t("drDashNoneOpen")}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant={requests.open ? "default" : "outline"}
                    onClick={() => router.push(`/customers/${resolvedParams.id}/requests`)}>
                    {t("drView")}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}

          {assessments && assessments.items.some((a) => a.status === "submitted" || a.status === "completed") && (
            <RequestAssessmentCard customerId={resolvedParams.id} />
          )}

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("customerRecentDocs")}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/customers/${resolvedParams.id}/documents`)
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {t("customerViewAllDocs")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents && documents.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("customerDocFilename")}</TableHead>
                      <TableHead>{t("customerDocType")}</TableHead>
                      <TableHead>{t("customerDocStatus")}</TableHead>
                      <TableHead>{t("customerDocUploaded")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.items.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {doc.original_filename}
                        </TableCell>
                        <TableCell>
                          {formatDocumentType(doc.document_type)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatProcessingStatus(doc.processing_status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(doc.uploaded_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-8 w-8 mb-2" />
                  <p>{t("customerNoDocsYet")}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      router.push(`/customers/${resolvedParams.id}/documents`)
                    }
                  >
                    {t("customerUploadDocs")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  {t("customerAssessments")}
                  {assessments && assessments.total > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {assessments.total}
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/customers/${resolvedParams.id}/assessments/new`,
                    )
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("customerNewAssessment")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assessments && assessments.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("customerAssessmentStatus")}</TableHead>
                      <TableHead>{t("customerAssessmentModules")}</TableHead>
                      <TableHead>{t("customerAssessmentCreated")}</TableHead>
                      <TableHead>{t("customerAssessmentSubmitted")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.items.map((a) => (
                      <TableRow
                        key={a.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          router.push(
                            `/customers/${resolvedParams.id}/assessments/${a.id}`,
                          )
                        }
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              a.status === "submitted"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : a.status === "completed"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }
                          >
                            {a.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.modules_completed}/10 {t("customerAssessmentModulesOf")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(a.created_at)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.submitted_at ? formatDate(a.submitted_at) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="mx-auto h-8 w-8 mb-2" />
                  <p>{t("customerNoAssessments")}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      router.push(
                        `/customers/${resolvedParams.id}/assessments/new`,
                      )
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("customerStartAssessment")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("customerEditTitle")}</DialogTitle>
            <DialogDescription>
              {t("customerEditDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("customerCompanyName")}</Label>
                <Input
                  id="edit-name"
                  value={formData.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-industry_sector">{t("customerIndustry")}</Label>
                <Select
                  value={formData.industry_sector}
                  onValueChange={(val) =>
                    updateField("industry_sector", val as IndustrySector)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(IndustrySector).map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {formatIndustrySector(sector)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ownership_type">{t("customerOwnership")}</Label>
                <Select
                  value={formData.ownership_type}
                  onValueChange={(val) =>
                    updateField("ownership_type", val as OwnershipType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(OwnershipType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatOwnershipType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showStateOwnership && (
              <div className="space-y-2">
                <Label htmlFor="edit-state_ownership_percentage">
                  {t("customerStateOwnershipPct")}
                </Label>
                <Input
                  id="edit-state_ownership_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.state_ownership_percentage ?? ""}
                  onChange={(e) =>
                    updateField(
                      "state_ownership_percentage",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
                {validationErrors.state_ownership_percentage && (
                  <p className="text-sm text-red-600">
                    {validationErrors.state_ownership_percentage}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-headquarters_country">
                  {t("customerHQCountry")}
                </Label>
                <Input
                  id="edit-headquarters_country"
                  value={formData.headquarters_country || ""}
                  onChange={(e) =>
                    updateField("headquarters_country", e.target.value)
                  }
                />
                {validationErrors.headquarters_country && (
                  <p className="text-sm text-red-600">
                    {validationErrors.headquarters_country}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-headquarters_city">
                  {t("customerHQCity")}
                </Label>
                <Input
                  id="edit-headquarters_city"
                  value={formData.headquarters_city || ""}
                  onChange={(e) =>
                    updateField("headquarters_city", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-us_presence">{t("customerUSPresence")}</Label>
              <Textarea
                id="edit-us_presence"
                value={formData.us_presence || ""}
                onChange={(e) => updateField("us_presence", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-us_subsidiary_name">
                {t("customerUSSubsidiaryName")}
              </Label>
              <Input
                id="edit-us_subsidiary_name"
                value={formData.us_subsidiary_name || ""}
                onChange={(e) =>
                  updateField("us_subsidiary_name", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-website">{t("customerWebsite")}</Label>
              <Input
                id="edit-website"
                type="url"
                value={formData.website || ""}
                onChange={(e) => updateField("website", e.target.value)}
              />
              {validationErrors.website && (
                <p className="text-sm text-red-600">
                  {validationErrors.website}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t("customerNotes")}</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes || ""}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              {t("customerDeleteCancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              <Save className="mr-2 h-4 w-4" />
              {updating ? t("customerEditSaving") : t("customerEditSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CustomerDetailPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <CustomerDetailContent params={params} />
    </ProtectedRoute>
  );
}
