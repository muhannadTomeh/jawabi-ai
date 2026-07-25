import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useChatbot } from "./useChatbot";
import { toast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  chatbot_id: string;
  type: string;
  title: string;
  channel: string;
  contact_identifier: string;
  contact_name: string | null;
  last_message: string | null;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

export function useNotifications() {
  const { chatbot } = useChatbot();
  const queryClient = useQueryClient();
  const chatbotId = chatbot?.id;
  const queryKey = ["notifications", chatbotId] as const;

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey,
    enabled: !!chatbotId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("chatbot_id", chatbotId!)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as Notification[];
    },
  });

  // Ref-counted realtime subscription: one channel per chatbot, shared across
  // every mounted `useNotifications` consumer.
  useEffect(() => {
    if (!chatbotId) return;
    const entry = acquireNotificationsChannel(chatbotId, () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", chatbotId] });
    });
    return () => entry.release();
  }, [chatbotId, queryClient]);

  // Ask once for browser notification permission so alerts reach the owner
  // even when the dashboard tab is in the background.
  useEffect(() => {
    if (!chatbotId) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem("jawabi_notif_prompted")) return;
    localStorage.setItem("jawabi_notif_prompted", "1");
    Notification.requestPermission().catch(() => {});
  }, [chatbotId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    if (!chatbot?.id) return;
    await supabase.from("notifications").update({ is_read: true }).eq("chatbot_id", chatbot.id).eq("is_read", false);
  };

  const resolve = async (id: string) => {
    await supabase.from("notifications").update({ is_resolved: true, is_read: true }).eq("id", id);
  };

  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
  };

  return {
    notifications,
    loading: !!chatbotId && isLoading,
    unreadCount,
    markRead,
    markAllRead,
    resolve,
    remove,
  };
}

// ---- shared realtime channel registry (module scope) ---------------------
type Entry = {
  channel: RealtimeChannel;
  listeners: Set<() => void>;
  count: number;
};
const registry = new Map<string, Entry>();

function acquireNotificationsChannel(chatbotId: string, onChange: () => void) {
  let entry = registry.get(chatbotId);
  if (!entry) {
    const listeners = new Set<() => void>();
    const channel = supabase
      .channel(`notifications-${chatbotId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `chatbot_id=eq.${chatbotId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            announce(payload.new as Notification);
          }
          listeners.forEach((fn) => fn());
        }
      )
      .subscribe();
    entry = { channel, listeners, count: 0 };
    registry.set(chatbotId, entry);
  }
  entry.count += 1;
  entry.listeners.add(onChange);
  const current = entry;
  return {
    release() {
      current.listeners.delete(onChange);
      current.count -= 1;
      if (current.count <= 0) {
        supabase.removeChannel(current.channel);
        registry.delete(chatbotId);
      }
    },
  };
}