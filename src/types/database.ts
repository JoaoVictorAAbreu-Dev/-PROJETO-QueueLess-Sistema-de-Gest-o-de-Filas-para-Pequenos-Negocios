export type QueueStatus = "waiting" | "called" | "completed" | "cancelled";

export type Profile = {
  id: string;
  business_name: string;
  public_slug: string;
  created_at: string;
  updated_at: string;
};

export type QueueEntry = {
  id: string;
  profile_id: string;
  customer_name: string;
  phone: string | null;
  party_size: number;
  notes: string | null;
  status: QueueStatus;
  position: number;
  created_at: string;
  called_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

export type AttendanceHistory = {
  id: string;
  profile_id: string;
  queue_entry_id: string | null;
  customer_name: string;
  party_size: number;
  wait_time_minutes: number;
  served_at: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          business_name: string;
          public_slug?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      queue_entries: {
        Row: QueueEntry;
        Insert: {
          id?: string;
          profile_id: string;
          customer_name: string;
          phone?: string | null;
          party_size?: number;
          notes?: string | null;
          status?: QueueStatus;
          position?: number;
          created_at?: string;
          called_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Omit<QueueEntry, "id" | "profile_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "queue_entries_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_history: {
        Row: AttendanceHistory;
        Insert: {
          id?: string;
          profile_id: string;
          queue_entry_id?: string | null;
          customer_name: string;
          party_size?: number;
          wait_time_minutes: number;
          served_at?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AttendanceHistory, "id" | "profile_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "attendance_history_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_history_queue_entry_id_fkey";
            columns: ["queue_entry_id"];
            isOneToOne: false;
            referencedRelation: "queue_entries";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      queue_status: QueueStatus;
    };
  };
};

export type DailyAnalytics = {
  totalAttendances: number;
  averageWaitMinutes: number;
  peakHour: string;
  hourlyMovement: Array<{
    hour: string;
    attendances: number;
  }>;
};
