
import React, { useState, useEffect, useCallback } from "react";
import { getComments, Comment } from "@/data/mockComments";
import CommentItem from "./CommentItem";
import AddCommentForm from "./AddCommentForm";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentsSectionProps {
  projectId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ projectId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    const fetchedComments = await getComments(projectId);
    setComments(fetchedComments);
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <div className="pt-6 border-t">
      <h4 className="text-lg font-semibold mb-2">Comments & Feedback</h4>
      <div className="divide-y">
        {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-4 py-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            ))
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <p className="text-muted-foreground py-4">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
      <AddCommentForm projectId={projectId} onCommentAdded={fetchComments} />
    </div>
  );
};

export default CommentsSection;
