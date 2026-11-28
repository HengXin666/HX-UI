import type { ActivityMode, CodeTheme, OrchestraView } from "@/agent";
import type { DemoProps } from "../types";
import { ConversationPage } from "./agent/conversation-page";

export default function AgentConversationDemo({ values, onEvent }: DemoProps) {
  return (
    <ConversationPage
      speed={Number(values.speed)}
      mode={values.mode as ActivityMode}
      codeTheme={values.codeTheme as CodeTheme}
      orchestraView={values.orchestraView as OrchestraView}
      onEvent={onEvent}
    />
  );
}
