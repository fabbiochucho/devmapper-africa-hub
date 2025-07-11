
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { addComment } from "@/data/mockComments";
import { Star } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  comment: z.string().min(10, {
    message: "Comment must be at least 10 characters.",
  }),
});

interface AddCommentFormProps {
  projectId: string;
  onCommentAdded: () => void;
}

const AddCommentForm: React.FC<AddCommentFormProps> = ({ projectId, onCommentAdded }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comment: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast.error("You must be logged in to comment.");
        return;
    }
    
    try {
      await addComment({
        projectId,
        comment: values.comment,
        rating,
        userId: user.id,
        userName: user.email || 'Anonymous',
      });
      toast.success("Comment added successfully!");
      form.reset();
      setRating(null);
      onCommentAdded();
    } catch (error) {
      toast.error("Failed to add comment.");
    }
  }

  if (!user) {
    return (
      <div className="text-center text-muted-foreground p-4 border-t">
        Please sign in to leave a comment.
      </div>
    );
  }

  return (
    <div className="pt-4 border-t">
        <h4 className="font-semibold mb-2">Leave a comment</h4>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
                <FormLabel>Rating</FormLabel>
                <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-6 w-6 cursor-pointer ${
                        (hoverRating || rating || 0) >= star
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                    />
                    ))}
                </div>
            </FormItem>
            <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Comment</FormLabel>
                <FormControl>
                    <Textarea placeholder="Share your thoughts on this project..." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : "Submit Comment"}
            </Button>
        </form>
        </Form>
    </div>
  );
};

export default AddCommentForm;
