import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Star,
  MessageCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  DollarSign,
  User,
} from "lucide-react";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { getComments, addComment, Comment } from "@/data/mockComments";
import { Report, Verification } from "@/data/mockReports";
import { toast } from "sonner";

interface ProjectDetailsProps {
  report: Report | null;
  onUpdate: (updatedReport: Report) => void;
}

export default function ProjectDetails({
  report: project,
  onUpdate,
}: ProjectDetailsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (project) {
      fetchComments();
    }
  }, [project]);

  const fetchComments = async () => {
    if (!project) return;
    try {
      const data = await getComments(project.id);
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      toast.error("Failed to fetch comments.");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !project) {
      if (!user) toast.error("You must be logged in to comment.");
      return;
    }

    setIsSubmittingComment(true);

    try {
      await addComment({
        projectId: project.id,
        comment: newComment,
        rating: newRating > 0 ? newRating : null,
        userId: user.id,
        userName: user.email || 'Anonymous',
      });
      toast.success("Comment submitted successfully!");
      setNewComment("");
      setNewRating(0);
      fetchComments();
    } catch (error) {
      console.error("Failed to submit comment:", error);
      toast.error("Failed to submit comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleVerification = async (action: "confirm" | "dispute") => {
    if (!user) {
      toast.error("You must be logged in to verify projects.");
      return;
    }
    if (!project) return;

    const hasVerified =
      project.verifications?.some((v) => v.userId === user.id) || false;

    if (hasVerified) {
      toast.info("You have already verified this project.");
      return;
    }

    setIsVerifying(true);

    const newVerification: Verification = {
      id: (project.verifications?.length || 0) + 1,
      userId: user.id,
      userName: user.email || 'Anonymous',
      action: action,
      createdAt: new Date().toISOString(),
      notes: `${
        action === "confirm" ? "Confirmed" : "Disputed"
      } by ${user.email || 'Anonymous'}`,
    };

    const updatedVerifications = [
      ...(project.verifications || []),
      newVerification,
    ];

    const confirmations = updatedVerifications.filter(
      (v) => v.action === "confirm"
    ).length;
    const disputes = updatedVerifications.filter(
      (v) => v.action === "dispute"
    ).length;
    const total = confirmations + disputes;
    const verificationScore =
      total > 0 ? Math.round((confirmations / total) * 100) : 0;

    let newStatus = project.project_status;
    if (verificationScore >= 80 && confirmations >= 3) {
      newStatus = "completed";
    } else if (verificationScore <= 20 && disputes >= 3) {
      newStatus = "stalled";
    }

    const updatedReport: Report = {
      ...project,
      verifications: updatedVerifications,
      verification_score: verificationScore,
      validations: updatedVerifications.length,
      project_status: newStatus,
    };

    onUpdate(updatedReport);
    toast.success(
      `Project ${
        action === "confirm" ? "confirmed" : "disputed"
      } successfully!`
    );
    setIsVerifying(false);
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onRate?: (rating: number) => void
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const getStatusColor = (status: Report["project_status"]) => {
    const statusColors: Record<Report["project_status"], string> = {
      planned: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      stalled: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getSdgColor = (goal: string) => {
    const sdgGoalNumber = parseInt(goal, 10);
    const colors: Record<number, string> = {
      1: "#E5243B", 2: "#DDA63A", 3: "#4C9F38", 4: "#C5192D", 5: "#FF3A21",
      6: "#26BDE2", 7: "#FCC30B", 8: "#A21942", 9: "#FD6925", 10: "#DD1367",
      11: "#FD9D24", 12: "#BF8B2E", 13: "#3F7E44", 14: "#0A97D9", 15: "#56C02B",
      16: "#00689D", 17: "#19486A",
    };
    return colors[sdgGoalNumber] || "#666666";
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return "N/A";
    if (budget >= 1000000) return `$${(budget / 1000000).toFixed(1)}M`;
    if (budget >= 1000) return `$${(budget / 1000).toFixed(1)}K`;
    return `$${budget}`;
  };

  if (!project) return null;

  return (
    <>
      <div className="mb-4">
        <h2 className="text-xl font-bold">{project.title}</h2>
      </div>

      <div className="space-y-6">
        {/* Project Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getSdgColor(project.sdg_goal) }}
              />
              <span className="font-medium">SDG {project.sdg_goal}</span>
              {project.sdg_target && (
                <span className="text-gray-600">- {project.sdg_target}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {project.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(project.submitted_at).toLocaleDateString()}
              </span>
              {project.cost && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatBudget(project.cost)}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <Badge className={getStatusColor(project.project_status)}>
              {project.project_status.replace("_", " ")}
            </Badge>
            <div className="text-sm text-gray-600 mt-1">
              {project.verification_score ?? 0}% verified
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div>
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-700">{project.description}</p>
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>Reported by Anonymous</span>
        </div>

        {/* Verification Actions */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Community Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleVerification("confirm")}
                  disabled={
                    isVerifying ||
                    project.verifications?.some((v) => v.userId === user.id)
                  }
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm Project
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleVerification("dispute")}
                  disabled={
                    isVerifying ||
                    project.verifications?.some((v) => v.userId === user.id)
                  }
                  className="flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Dispute Project
                </Button>
              </div>
              {project.verifications?.some((v) => v.userId === user.id) ? (
                <p className="text-sm text-green-600 mt-2">
                  Thanks for your contribution!
                </p>
              ) : (
                <p className="text-sm text-gray-600 mt-2">
                  Help verify this project's authenticity and impact
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments & Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Comment Form */}
            {user ? (
              <form onSubmit={handleSubmitComment} className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="comment">Add a comment</Label>
                  <Textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this project..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Rate this project (optional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(newRating, true, setNewRating)}
                    {newRating > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewRating(0)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                >
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Please login to comment and rate projects</p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment: Comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {comment.userName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              comment.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {comment.rating && (
                        <div className="flex items-center gap-1">
                          {renderStars(comment.rating)}
                          <span className="text-sm text-gray-600">
                            ({comment.rating})
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-gray-700">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No comments yet</p>
                  <p className="text-sm">
                    Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
