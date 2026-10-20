import type { JSX } from "react";
import {
  Avatar, AvatarFallback, Badge, Bubble, Marker, MarkerContent,
  Message, MessageAvatar, MessageContent, MessageHeader,
} from "@hx/ui";
import { DiffView, InlineApproval, StreamingText, ToolCallCard } from "@hx/ui";
import {
  CONFIRM_DETAIL, DIFF_LINES, INDENT, KIND, STATUS, TOOL_ARGS, TOOL_DURATION_MS,
  TOOL_NAME, TOOL_RESULT, type EventItem,
} from "./agent-overview-copy";

/** 把一条事件渲染成会话内容, 过程件复用 agent/ 里的真实组件. */
export function AgentEventView({
  item,
  onApprove,
  onReject,
}: {
  readonly item: EventItem;
  readonly onApprove: () => void;
  readonly onReject: () => void;
}): JSX.Element {
  switch (item.kind) {
    case KIND.user:
      return (
        <Message align="end">
          <MessageAvatar>
            <Avatar size="sm"><AvatarFallback>你</AvatarFallback></Avatar>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader><strong>你</strong><span>刚刚</span></MessageHeader>
            <Bubble variant="primary" align="end">{item.text}</Bubble>
          </MessageContent>
        </Message>
      );
    case KIND.assistant:
      return (
        <Message>
          <MessageAvatar>
            <Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>
              <strong>Agent</strong>
              {item.streaming && <Badge variant="default">生成中</Badge>}
            </MessageHeader>
            <Bubble variant="ghost" align="start" className="max-w-full">
              <StreamingText text={item.text ?? ""} streaming={!!item.streaming} />
            </Bubble>
          </MessageContent>
        </Message>
      );
    case KIND.tool: {
      const running = (item.status ?? STATUS.running) === STATUS.running;
      return (
        <div className={INDENT}>
          <ToolCallCard
            name={TOOL_NAME}
            args={TOOL_ARGS}
            result={running ? undefined : TOOL_RESULT}
            status={running ? "running" : "ok"}
            durationMs={running ? undefined : TOOL_DURATION_MS}
            defaultOpen
          />
        </div>
      );
    }
    case KIND.confirm:
      return (
        <div className={INDENT}>
          <InlineApproval detail={CONFIRM_DETAIL} onApprove={onApprove} onReject={onReject} />
        </div>
      );
    case KIND.diff:
      return (
        <div className={INDENT}>
          <DiffView hunks={[...DIFF_LINES]} filename="src/agent/tool.ts" />
        </div>
      );
    case KIND.marker:
      return <Marker variant="separator"><MarkerContent>{item.text}</MarkerContent></Marker>;
    default:
      return <></>;
  }
}
