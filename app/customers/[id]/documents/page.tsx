"use client";

import { useLanguage } from "@/lib/language-context";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { PortalHeader } from "@/components/portal-header";
import { DocumentUpload } from "@/components/document-upload";
import { useCustomer } from "@/hooks/use-customers";
import {
  useCustomerDocuments,
  useDocumentDownload,
  useUpdateDocumentClassification,
  useDeleteDocument,
} from "@/hooks/use-documents";
import { useApiToast } from "@/hooks/use-api-toast";
import { DocumentType, type DocumentListItem } from "@/lib/api-types";
import {
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
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  Trash2,
  FileText,
  MoreHorizontal,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const L = {
  en: { title: "Documents", sub: "Company documents", n: (k: number) => `${k} document${k === 1 ? "" : "s"}`, failed: "Could not load documents:", retry: "Retry",
        none: "No documents yet", noneText: "Upload documents with the form above. Only your company and, during a comprehensive assessment, its TBRAC evaluators can see them.",
        filename: "File", size: "Size", type: "Type", status: "Status", uploaded: "Uploaded", classify: "Classify document",
        classifyFor: (f: string) => `Choose a document type for ${f}`, docType: "Document type", selectType: "Select a document type",
        cancel: "Cancel", save: "Save", saving: "Saving…", del: "Delete document", delText: "This permanently deletes the document. This cannot be undone.",
        delete: "Delete", deleting: "Deleting…", classified: "Document type updated", deleted: "Document deleted" },
  zh: { title: "文件", sub: "企业文件", n: (k: number) => `共 ${k} 份文件`, failed: "无法加载文件：", retry: "重试",
        none: "暂无文件", noneText: "请使用上方表单上传文件。仅贵公司以及全面评估期间的 TBRAC 评估人员可以查看。",
        filename: "文件", size: "大小", type: "类型", status: "状态", uploaded: "上传时间", classify: "设置文件类型",
        classifyFor: (f: string) => `为 ${f} 选择文件类型`, docType: "文件类型", selectType: "选择文件类型",
        cancel: "取消", save: "保存", saving: "正在保存…", del: "删除文件", delText: "这将永久删除该文件，且无法撤销。",
        delete: "删除", deleting: "正在删除…", classified: "已更新文件类型", deleted: "已删除文件" },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function CustomerDocumentsContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { language } = useLanguage();
  const l = L[language] ?? L.en;
  const [page, setPage] = useState(1);
  const [editingDoc, setEditingDoc] = useState<DocumentListItem | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const { data: customer } = useCustomer(resolvedParams.id);
  const { data, loading, error, refetch } = useCustomerDocuments(
    resolvedParams.id,
    { page, pageSize: 10 },
  );
  const { download } = useDocumentDownload();
  const { updateClassification, loading: classifying } =
    useUpdateDocumentClassification();
  const { deleteDocument, loading: deleting } = useDeleteDocument();
  const { handleError, showSuccess } = useApiToast();

  const handleDownload = async (doc: DocumentListItem) => {
    try {
      await download(doc.id, doc.original_filename);
    } catch (err) {
      handleError(err);
    }
  };

  const handleClassify = async () => {
    if (!editingDoc || !selectedType) return;

    try {
      await updateClassification(editingDoc.id, selectedType);
      showSuccess(l.classified);
      setEditingDoc(null);
      setSelectedType("");
      refetch();
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async () => {
    if (!deletingDocId) return;

    try {
      await deleteDocument(deletingDocId);
      showSuccess(l.deleted);
      setDeletingDocId(null);
      refetch();
    } catch (err) {
      handleError(err);
    }
  };

  const getProcessingStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "pending") {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          {formatProcessingStatus(status as any)}
        </Badge>
      );
    }
    if (statusLower === "processing") {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          {formatProcessingStatus(status as any)}
        </Badge>
      );
    }
    if (statusLower === "completed") {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          {formatProcessingStatus(status as any)}
        </Badge>
      );
    }
    if (statusLower === "failed") {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          {formatProcessingStatus(status as any)}
        </Badge>
      );
    }
    if (statusLower === "requires_review") {
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          {formatProcessingStatus(status as any)}
        </Badge>
      );
    }
    return <Badge variant="outline">{formatProcessingStatus(status as any)}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/customers/${resolvedParams.id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{l.title}</h1>
              <p className="text-muted-foreground mt-1">
                {customer ? `${customer.name}` : l.sub}
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <DocumentUpload
            customerId={resolvedParams.id}
            onUploadComplete={() => {
              refetch();
            }}
          />

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {data ? l.n(data.total) : l.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="text-center py-8 text-red-600">
                  <p>{l.failed} {error}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => refetch()}
                  >
                    {l.retry}
                  </Button>
                </div>
              )}

              {loading && (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-5 w-[250px]" />
                      <Skeleton className="h-5 w-[100px]" />
                      <Skeleton className="h-5 w-[120px]" />
                      <Skeleton className="h-5 w-[100px]" />
                      <Skeleton className="h-5 w-[80px]" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && !error && data && data.items.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    {l.none}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {l.noneText}
                  </p>
                </div>
              )}

              {!loading && !error && data && data.items.length > 0 && (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{l.filename}</TableHead>
                        <TableHead>{l.size}</TableHead>
                        <TableHead>{l.type}</TableHead>
                        <TableHead>{l.status}</TableHead>
                        <TableHead className="hidden lg:table-cell">
                          {l.uploaded}
                        </TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            {doc.original_filename}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatFileSize(doc.file_size_bytes)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {formatDocumentType(doc.document_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getProcessingStatusBadge(doc.processing_status)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {formatDate(doc.uploaded_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleDownload(doc)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingDoc(doc);
                                    setSelectedType(
                                      doc.document_type || DocumentType.OTHER,
                                    );
                                  }}
                                >
                                  <Tag className="mr-2 h-4 w-4" />
                                  Classify
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingDocId(doc.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {data.total_pages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {data.page} of {data.total_pages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= data.total_pages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Classification Dialog */}
      <Dialog
        open={editingDoc !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDoc(null);
            setSelectedType("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{l.classify}</DialogTitle>
            <DialogDescription>
              {editingDoc && l.classifyFor(editingDoc.original_filename)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">{l.docType}</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder={l.selectType} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DocumentType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatDocumentType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingDoc(null);
                setSelectedType("");
              }}
              disabled={classifying}
            >
              {l.cancel}
            </Button>
            <Button onClick={handleClassify} disabled={classifying}>
              {classifying ? l.saving : l.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deletingDocId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingDocId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{l.del}</AlertDialogTitle>
            <AlertDialogDescription>
              {l.delText}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{l.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? l.deleting : l.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CustomerDocumentsPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <CustomerDocumentsContent params={params} />
    </ProtectedRoute>
  );
}
