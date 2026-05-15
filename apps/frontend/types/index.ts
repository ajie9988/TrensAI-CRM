export interface User {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "agent" | "viewer";
  tenant_id: number;
  avatar_url?: string;
}

export interface Contact {
  id: number;
  tenant_id: number;
  phone_number: string;
  name?: string;
  email?: string;
  tags?: string[];
  notes?: string;
  message_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  contact_id: number;
  message_id: string;
  direction: "incoming" | "outgoing";
  type: "text" | "image" | "video" | "audio" | "document";
  content: string;
  created_at: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
}

export interface Conversation {
  id: number;
  contact_id: number;
  assigned_user_id?: number;
  status: "open" | "closed" | "unread" | "archived";
  unread_count: number;
  contact: Contact;
}

export interface Flow {
  id: number;
  name: string;
  description?: string;
  trigger_type: string;
  is_active: boolean;
  execution_count: number;
}

export interface Device {
  id: number;
  phone_number: string;
  device_name?: string;
  status: "connected" | "disconnected" | "connecting" | "error";
}
