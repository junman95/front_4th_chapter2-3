import React from "react"
import { Edit2, Plus, ThumbsUp, Trash2 } from "lucide-react"
import { Button } from "../../../shared/ui"
import { NewComment } from "../../../entities/comment/model/types"
import { Comment } from "../../../entities/comment/model/types"
import { highlightText } from "../../../shared/lib/highlightText"
import { useGetComments } from "../model/useGetComments.query"

interface CommentListProps {
  postId: number
  searchQuery: string
  comments: Record<number, Comment[]>
  setNewComment: React.Dispatch<React.SetStateAction<NewComment>>
  setSelectedComment: React.Dispatch<React.SetStateAction<Comment | null>>
  likeComment: (commentId: number, postId: number) => Promise<void>
  deleteComment: (commentId: number, postId: number) => Promise<void>
  setShowAddCommentDialog: React.Dispatch<React.SetStateAction<boolean>>
  setShowEditCommentDialog: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * TODO: 로직 분리
 */
const CommentList: React.FC<CommentListProps> = ({
  postId,
  searchQuery,
  setNewComment,
  setSelectedComment,
  likeComment,
  deleteComment,
  setShowAddCommentDialog,
  setShowEditCommentDialog,
}) => {
  const { postComments } = useGetComments({
    postId: postId,
  })
  if (!postComments) return null
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">댓글</h3>
        <Button
          size="sm"
          onClick={() => {
            setNewComment((prev) => ({ ...prev, postId }))
            setShowAddCommentDialog(true)
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          댓글 추가
        </Button>
      </div>
      <div className="space-y-1">
        {postComments[postId]?.map((comment) => (
          <div
            key={comment.id}
            className="flex items-center justify-between text-sm border-b pb-1"
          >
            <div className="flex items-center space-x-2 overflow-hidden">
              <span className="font-medium truncate">
                {comment.user.username}:
              </span>
              <span className="truncate">
                {highlightText(comment.body, searchQuery)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => likeComment(comment.id, postId)}
              >
                <ThumbsUp className="w-3 h-3" />
                <span className="ml-1 text-xs">{comment.likes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedComment(comment)
                  setShowEditCommentDialog(true)
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteComment(comment.id, postId)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CommentList
