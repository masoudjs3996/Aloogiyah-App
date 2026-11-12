"use clinet";
import { UserIcon } from "lucide-react";

type Comment = {
  code: string;
  name: string;
  content: string;
  createdAt: string;
  subComments?: Comment[];
};

export const CommentCard = ({
  comment,
  formatDate,
  onReply,
}: {
  comment: Comment;
  formatDate: (date: string) => string;
  onReply: () => void;
}) => {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gray-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
              <UserIcon className="h-5 w-5 text-green-600" />
            </div>

            <span className="text-xs font-semibold">{comment.name}</span>
          </div>

          <span className="text-[10px] text-gray-400">
            {formatDate(comment.createdAt)}
          </span>
        </div>

        <p className="text-xs leading-7 text-gray-600">{comment.content}</p>

        <button
          onClick={onReply}
          className="mt-3 text-[11px] font-medium text-green-600"
        >
          پاسخ
        </button>
      </div>

      {comment?.subComments?.map((reply) => (
        <div
          key={reply.code}
          className="mr-8 rounded-2xl border border-green-100 bg-green-50 p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                {/* <LeafIcon className="h-4 w-4 text-green-600" /> */}
              </div>

              <span className="text-xs font-semibold text-green-800">
                {reply.name}
              </span>
            </div>

            <span className="text-[10px] text-gray-400">
              {formatDate(reply.createdAt)}
            </span>
          </div>

          <p className="text-xs leading-6 text-gray-600">{reply.content}</p>
        </div>
      ))}
    </div>
  );
};
