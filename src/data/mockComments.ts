
import { formatDistanceToNow } from "date-fns";

export interface Comment {
  id: number;
  projectId: string;
  comment: string;
  rating: number | null;
  userId: number;
  userName:string;
  createdAt: string;
}

const comments: Record<string, Comment[]> = {
  "REP-001": [
    {
      id: 1,
      projectId: "REP-001",
      comment: "Great progress on this project! The community is already seeing the benefits.",
      rating: 5,
      userId: 2,
      userName: "Demo NGO Member",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      projectId: "REP-001",
      comment: "Keep up the excellent work. This is vital for our region.",
      rating: 4,
      userId: 3,
      userName: "Demo Government Official",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "REP-002": [
    {
      id: 3,
      projectId: "REP-002",
      comment: "A truly impactful initiative. So proud to see it completed.",
      rating: 5,
      userId: 1,
      userName: "Demo Citizen",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
};

export const getComments = (projectId: string): Promise<Comment[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(comments[projectId] || []);
    }, 300);
  });
};

export const addComment = (data: {
  projectId: string;
  comment: string;
  rating: number | null;
  userId: number;
  userName: string;
}): Promise<Comment> => {
  return new Promise((resolve) => {
    if (!comments[data.projectId]) {
      comments[data.projectId] = [];
    }

    const newComment: Comment = {
      id: Date.now(),
      projectId: data.projectId,
      comment: data.comment,
      rating: data.rating,
      userId: data.userId,
      userName: data.userName,
      createdAt: new Date().toISOString(),
    };

    comments[data.projectId].unshift(newComment);

    setTimeout(() => {
      resolve(newComment);
    }, 200);
  });
};
